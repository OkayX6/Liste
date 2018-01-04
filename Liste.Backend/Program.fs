module Liste.Backend

open Suave
open Suave.Filters
open Suave.Operators
open Suave.Successful
open Suave.CORS
open Suave.Writers
open Newtonsoft.Json
open System.Text
open FSharp.Data.JsonExtensions
open FSharp.Data
open System.IO
open Suave.RequestErrors
open Suave.ServerErrors
open Liste.Backend
open Liste.Backend.Types

type HttpClient = FSharp.Data.Http

let internal PublicDirectory = __SOURCE_DIRECTORY__ + "\\public"

let corsConfig = { defaultCORSConfig with allowedUris = InclusiveOption.Some [ "http://localhost:3000" ] }
let serverConfig =
    { defaultConfig with homeFolder = Some PublicDirectory }

let initUserData = request (fun r ->
    match r.["userId"], r.["accessToken"] with
    | Some userId, Some accessToken ->
        // Throws on error
        let userInfoJson =
            HttpClient.RequestString("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends",
                headers=seq ["Authorization", sprintf "Bearer %s" accessToken])
        let userInfo = JsonValue.Parse(userInfoJson)

        let id = userInfo?id.AsString()
        if id = userId then
            let statement = sprintf "MERGE (n: User { userId: '%s' })" userId
            let body = Cypher.makeCypherRequestBody statement
            let response =
                HttpClient.Request(
                    "http://localhost:7474/db/data/transaction/commit",
                    headers = seq [
                        "Accept", "application/json; charset=UTF-8"
                        "Content-Type", "application/json"
                        "Authorization", "Basic bmVvNGo6UGFzc3dvcmQxMjM="
                    ],
                    httpMethod=HttpMethod.Post,
                    body = HttpRequestBody.TextRequest body)

            // if it passes, then we're good
            match response.Body with
            | Text(txt) -> printfn "- [GET /startup] neo4j server response: %s" txt
            | _ -> ()

            { Name = userInfo?name.AsString()
              PictureUrl = userInfo?picture?data?url.AsString()
              Friends = Array.empty }
            |> JsonConvert.SerializeObject
            |> OK
        else
            Suave.RequestErrors.UNAUTHORIZED "Unknown user or invalid access token"
        
    | _, _ -> RequestErrors.BAD_REQUEST "Missing data"
)

let addItem = request (fun r ->
    match r.["userId"], r.["accessToken"], r.["description"], r.files with
    | Some userId, _, Some desc, [file] ->
        // [x] get user id
        // [ ] check access token
        // [x] copy file to "[PUBLIC]/[user_id]/[fileName]"
        // [x] add item in Neo4j server
        let userDirectoryPath = Path.Combine(PublicDirectory, userId)
        // Create dir if it doesn't exist
        Directory.CreateDirectory(userDirectoryPath) |> ignore

        let pictureDestPath = Path.Combine(userDirectoryPath, file.fileName)

        File.Copy(file.tempFilePath, pictureDestPath, overwrite= true)

        let statement = Cypher.addItemStatement userId desc file.fileName
        let reqBody = Cypher.makeCypherRequestBody statement

        let response =
            HttpClient.Request(
                "http://localhost:7474/db/data/transaction/commit",
                headers = seq [
                    "Accept", "application/json; charset=UTF-8"
                    "Content-Type", "application/json"
                    "Authorization", "Basic bmVvNGo6UGFzc3dvcmQxMjM="
                ],
                httpMethod=HttpMethod.Post,
                body = HttpRequestBody.TextRequest reqBody)

        // if it passes, then we're good
        match response.Body with
        | Text(txt) -> printfn "- [POST /items] neo4j server response: %s" txt
        | _ -> ()

        OK "success"
    | _ -> BAD_REQUEST "missing data"
)

type private ListItemsProvider = JsonProvider<"""{"results":[{"columns":["i"],"data":[{"row":[{"description":"anniversaire","pictureFileName":"18673137_1734915279858214_123229596784953557_o.jpg"}],"meta":[{"id":4,"type":"node","deleted":false}]},{"row":[{"description":"num banh chok","pictureFileName":"21013928_465941063784264_7526666128899915644_o.jpg"}],"meta":[{"id":3,"type":"node","deleted":false}]}]}],"errors":[]}""", SampleIsList=false>

let listItems = request (fun r ->
    match r.["userId"], r.["accessToken"] with
    | Some userId, _ ->
        let statement = Cypher.listItemsStatement userId
        let reqBody = Cypher.makeCypherRequestBody statement

        let response =
            HttpClient.Request(
                "http://localhost:7474/db/data/transaction/commit",
                headers = seq [
                    "Accept", "application/json; charset=UTF-8"
                    "Content-Type", "application/json"
                    "Authorization", "Basic bmVvNGo6UGFzc3dvcmQxMjM="
                ],
                httpMethod=HttpMethod.Post,
                body = HttpRequestBody.TextRequest reqBody)

        // if it passes, then we're good
        match response.Body with
        | Text(responseJson) ->
            printfn "- [GET /items] neo4j server response: %s" responseJson

            let responseObject = ListItemsProvider.Parse(responseJson)
            let responseData = [|
                for data in responseObject.Results.[0].Data do
                    let item = data.Row.[0]
                    yield {
                        Description = item.Description
                        PictureFileName = item.PictureFileName
                    }
            |]
            responseData
            |> JsonConvert.SerializeObject
            |> OK
        | _ -> INTERNAL_ERROR "Didn't get data from Neo4j server"
    | _ -> BAD_REQUEST "missing data"
)

let app =
  choose
    [ GET >=> choose
        [
            choose [
                path "/startup" >=> initUserData
                path "/items" >=> listItems ]
                >=> setMimeType "application/json; charset=utf-8"
            Files.browseHome
            NOT_FOUND "Page not found." 
        ]
        >=> cors corsConfig
      POST >=> choose
        [ path "/items" >=> addItem
          path "/goodbye" >=> OK "Good bye POST" ]
        >=> cors corsConfig
    ]

[<EntryPoint>]
let main argv = 
    printfn "%A" argv
    0 // return an integer exit code
