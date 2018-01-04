#load "Scripts/load-references-debug.fsx"

open FSharp.Data

let s =
    let token = ""
    Http.RequestString("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends",
        headers=seq ["Authorization", sprintf "Bearer %s" token])
