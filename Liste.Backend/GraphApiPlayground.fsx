#load "Scripts/load-references-debug.fsx"

open FSharp.Data

type private DevConfigProvider = JsonProvider<"devconfig.json.example">
let devConfig = DevConfigProvider.Load("devconfig.json")

let s =
    let token = devConfig.FbAccessToken
    Http.RequestString("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends",
        headers=seq ["Authorization", sprintf "Bearer %s" token])
