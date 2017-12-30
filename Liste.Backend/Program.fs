open Suave
open Suave.Filters
open Suave.Operators
open Suave.Successful
open Suave.CORS
open Suave.Writers

let corsConfig = { defaultCORSConfig with allowedUris = InclusiveOption.Some [ "http://localhost:3000" ] }

let query () =
    FSharp.Data.Http.AsyncRequestString("https://graph.facebook.com/v2.11/me",
        query=["access_token", ""])
    |> ignore

let app =
  choose
    [ GET >=> choose
        [
            path "/startup"
                >=> OK """{ "picture": "http://weknowyourdreams.com/images/picture/picture-12.jpg" }"""
        ]
        >=> setMimeType "application/json; charset=utf-8"
        >=> cors corsConfig
      POST >=> choose
        [ path "/hello" >=> OK "Hello POST"
          path "/goodbye" >=> OK "Good bye POST" ] ]

[<EntryPoint>]
let main argv = 
    printfn "%A" argv
    0 // return an integer exit code
