module Liste.Backend.Cypher

open System

let makeCypherRequestBody statement =
    sprintf """{ "statements" : [{ "statement" : "%s" }]}"""  statement

let addItemStatement userId (itemId: Guid) description pictureUrl =
    sprintf "MATCH (u: User) WHERE u.userId = '%s' \
CREATE (u)-[:owns]->(i: Item { id: '%O', description: '%s', pictureFileName: '%s' })"
        userId itemId description pictureUrl

let listItemsStatement userId =
    sprintf "MATCH (u: User {userId: '%s'})-[:owns]->(i: Item) \
RETURN i LIMIT 1000"
        userId

let deleteItemStatement userId (itemId: Guid) =
    sprintf "MATCH (u: User)-[:owns]->(i: Item) WHERE \
    u.userId = '%s' AND i.id = '%s' \
DETACH DELETE i"
        userId (string itemId)
