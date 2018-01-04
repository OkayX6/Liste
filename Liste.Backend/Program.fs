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

type HttpClient = FSharp.Data.Http

let internal PublicDirectory = __SOURCE_DIRECTORY__ + "\\public"
let serverConfig =
    { defaultConfig with homeFolder = Some PublicDirectory }

let corsConfig = { defaultCORSConfig with allowedUris = InclusiveOption.Some [ "http://localhost:3000" ] }

type UserAuthInfo = {
    UserId: string
    AccessToken: string
}

type UserInfo = {
    Name: string
    PictureUrl: string
    Friends: string[]
}

let makeCypherRequestBody statement =
    sprintf """{ "statements" : [{ "statement" : "%s" }]}"""  statement

let addItemStatement userId description pictureUrl =
    sprintf "MATCH (n: User) WHERE n.userId = '%s' \
CREATE (n)-[:owns]->(i: Item { description: '%s', pictureFileName: '%s' })"
        userId description pictureUrl

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
            let body = makeCypherRequestBody statement
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
    printfn "query: %A" r.query
    printfn "files: %A" r.files
    printfn "form: %A" (r.form)
    printfn "multipart fields: %A" (r.multiPartFields)
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

        let statement = addItemStatement userId desc file.fileName
        let reqBody = makeCypherRequestBody statement

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

let app =
  choose
    [ GET >=> choose
        [
            path "/startup" >=> initUserData
                >=> setMimeType "application/json; charset=utf-8"
            path "/" >=> Files.file "\\test.jpg"
            Files.browseHome
            RequestErrors.NOT_FOUND "Page not found." 
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
