﻿module Liste.Backend.Api

open System
open System.IO
open Suave
open Suave.ServerErrors
open FSharp.Data
open FSharp.Data.JsonExtensions
open Liste.Backend.Types
open Newtonsoft.Json
open Suave.RequestErrors
open Suave.Successful

type HttpClient = FSharp.Data.Http

type private ListItemsProvider = JsonProvider<"""
    {"results":[{"columns":["i"],"data":[{"row":[{"description":"Alcool","id":"a95c411a-e5e5-4e25-810d-59251561ccf9","pictureFileName":"a95c411a-e5e5-4e25-810d-59251561ccf9.jpg"}],"meta":[{"id":16,"type":"node","deleted":false}]},{"row":[{"description":"CPH","id":"cbc7d731-e91c-4576-ab8e-5eb6c09e010b","pictureFileName":"cbc7d731-e91c-4576-ab8e-5eb6c09e010b.jpg"}],"meta":[{"id":15,"type":"node","deleted":false}]}]}],"errors":[]}"""
>

type private DeleteItemResultProvider = JsonProvider<"""
    {"results":[{"columns":["pictureFileName"],"data":[{"row":["file.jpg"],"meta":[null]}]}],"errors":[]}"""
>

let sendCypherRequest reqBody =
    HttpClient.Request(
        "http://localhost:7474/db/data/transaction/commit",
        headers = seq [
            "Accept", "application/json; charset=UTF-8"
            "Content-Type", "application/json"
            "Authorization", "Basic bmVvNGo6UGFzc3dvcmQxMjM="
        ],
        httpMethod=HttpMethod.Post,
        body = HttpRequestBody.TextRequest reqBody)

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
            let reqBody = Cypher.makeCypherRequestBody statement
            let response = sendCypherRequest reqBody

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
            UNAUTHORIZED "Unknown user or invalid access token"
    | _, _ -> BAD_REQUEST "Missing data"
)

let addItem = request (fun r ->
    match r.["userId"], r.["accessToken"], r.["description"], r.files with
    | Some userId, _, Some desc, [file] ->
        // [x] get user id
        // [ ] check access token
        // [x] copy file to "[PUBLIC]/[user_id]/[fileName]"
        // [x] add item in Neo4j server
        let userDirectoryPath = Path.Combine(Config.PublicDirectory, userId)
        // Create dir if it doesn't exist
        Directory.CreateDirectory(userDirectoryPath) |> ignore

        let itemId = Guid.NewGuid()
        let newPictureFileName =
            // Path.GetExtension retains the dot and returns ".jpg" for example
            // ToLower invariant fixes the issues where the '.JPG' wouldn't be served by Suave
            (string itemId) + Path.GetExtension(file.fileName).ToLower()

        let pictureDestPath = Path.Combine(userDirectoryPath, newPictureFileName)

        File.Copy(file.tempFilePath, pictureDestPath, overwrite= true)
        let statement = Cypher.addItemStatement userId itemId desc newPictureFileName
        let reqBody = Cypher.makeCypherRequestBody statement
        let response = sendCypherRequest reqBody

        // if it passes, then we're good
        match response.Body with
        | Text(txt) ->
            printfn "- [POST /items] neo4j server response: %s" txt
            CREATED (string itemId)
        | _ -> INTERNAL_ERROR "no answer from the DB server"
    | _ -> BAD_REQUEST "missing data"
)

let listItems = request (fun r ->
    match r.["userId"], r.["accessToken"] with
    | Some userId, _ ->
        let statement = Cypher.listItemsStatement userId
        let reqBody = Cypher.makeCypherRequestBody statement
        let response = sendCypherRequest reqBody

        // if it passes, then we're good
        match response.Body with
        | Text(responseJson) ->
            printfn "- [GET /items] neo4j server response: %s" responseJson

            let responseObject = ListItemsProvider.Parse(responseJson)
            let responseData = [|
                for data in responseObject.Results.[0].Data do
                    let item = data.Row.[0]
                    yield {
                        Id = string item.Id
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

let deleteItem (itemId: string) = request (fun r ->
    match r.["userId"], r.["accessToken"] with
    | Some userId, _ ->
        try
            let statement = Cypher.deleteItemStatement userId (Guid.Parse(itemId))
            let reqBody = Cypher.makeCypherRequestBody statement
            let response = sendCypherRequest reqBody

            // if it passes, then we're good
            match response.Body with
            | Text(responseJson) ->
                printfn "- [DELETE /item] neo4j server response: %s" responseJson
                let responseObject = DeleteItemResultProvider.Parse(responseJson)
                let pictureFileName = responseObject.Results.[0].Data.[0].Row.[0]
                let pictureFilePath = Path.Combine(Config.PublicDirectory, userId, pictureFileName)
                printfn "Deleting file: %s" pictureFilePath
                File.Delete(pictureFilePath)

                NO_CONTENT
            | _ -> INTERNAL_ERROR "Didn't get data from Neo4j server"
        with
            _ -> INTERNAL_ERROR "Couldn't delete requested resource"
    | _ -> BAD_REQUEST "Missing parameters"
)