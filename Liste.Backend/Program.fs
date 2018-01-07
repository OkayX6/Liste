module Liste.Backend.Program

open Suave
open Suave.Filters
open Suave.Operators
open Suave.Successful
open Suave.CORS
open Suave.Writers
open Suave.RequestErrors
open Liste.Backend

let corsConfig = { defaultCORSConfig with allowedUris = InclusiveOption.Some [ "http://localhost:3000" ] }
let serverConfig =
    { defaultConfig with homeFolder = Some Config.PublicDirectory }

let app =
  choose
    [ GET >=> choose
        [
            choose [
                path "/startup" >=> Api.initUserData
                path "/items" >=> Api.listItems ]
                >=> setMimeType "application/json; charset=utf-8"
            Files.browseHome
            NOT_FOUND "Page not found." 
        ]

      POST >=> choose
        [ path "/items" >=> Api.addItem
          path "/goodbye" >=> OK "Good bye POST" ]
      
      DELETE >=> pathScan "/items/%s" Api.deleteItem
      OPTIONS >=> OK "GET,POST,DELETE"
    ]
    >=> cors corsConfig

[<EntryPoint>]
let main argv = 
    startWebServer serverConfig app
    0 // return an integer exit code
