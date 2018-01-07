#load "Scripts/load-project-debug.fsx"

open System
open Liste.Backend
open FSharp.Data

type DevConfigProvider = JsonProvider<"devconfig.json.example", ResolutionFolder=__SOURCE_DIRECTORY__>

let devConfig = DevConfigProvider.Load("../devconfig.json")

let deleteItemStatement userId (itemId: Guid) =
    sprintf "MATCH (u: User)-[:owns]->(i: Item) WHERE \
    u.userId = '%s' AND i.id = '%s' \
    WITH i, i.pictureFileName as pictureFileName \
DETACH DELETE i \
RETURN pictureFileName"
        userId (string itemId)

let reqBody =
    deleteItemStatement devConfig.FbId (Guid.Parse("875a7072-d078-4ab3-98e3-2763b6192e3d"))
    |> Cypher.makeCypherRequestBody
    
let x =
    Api.sendCypherRequest reqBody

x.Body