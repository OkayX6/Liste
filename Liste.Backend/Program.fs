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

type HttpClient = FSharp.Data.Http

let corsConfig = { defaultCORSConfig with allowedUris = InclusiveOption.Some [ "http://localhost:3000" ] }

let query () =
    HttpClient.AsyncRequestString("https://graph.facebook.com/v2.11/me",
        query=["access_token", ""])
    |> ignore

type UserAuthInfo = {
    UserId: string
    AccessToken: string
}

type UserInfo = {
    Name: string
    PictureUrl: string
    Friends: string[]
}

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
            { Name = userInfo?name.AsString()
              PictureUrl = userInfo?picture?data?url.AsString()
              Friends = Array.empty }
            |> JsonConvert.SerializeObject
            |> OK
        else
            Suave.RequestErrors.UNAUTHORIZED "Unknown user or invalid access token"
        
    | _, _ -> RequestErrors.BAD_REQUEST "Missing data"
)

let createItem = request (fun r ->
    printfn "query: %A" r.query
    printfn "files: %A" r.files
    printfn "form: %A" (r.form)
    printfn "multipart fields: %A" (r.multiPartFields)
    OK "success"
)

let app =
  choose
    [ GET >=> choose
        [
            path "/startup" >=> initUserData
        ]
        >=> setMimeType "application/json; charset=utf-8"
        >=> cors corsConfig
      POST >=> choose
        [ path "/cuir" >=> createItem
          path "/goodbye" >=> OK "Good bye POST" ]
        >=> cors corsConfig
    ]

[<EntryPoint>]
let main argv = 
    printfn "%A" argv
    0 // return an integer exit code
