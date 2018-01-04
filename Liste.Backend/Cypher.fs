module Liste.Backend.Cypher

let makeCypherRequestBody statement =
    sprintf """{ "statements" : [{ "statement" : "%s" }]}"""  statement

let addItemStatement userId description pictureUrl =
    sprintf "MATCH (u: User) WHERE u.userId = '%s' \
CREATE (u)-[:owns]->(i: Item { description: '%s', pictureFileName: '%s' })"
        userId description pictureUrl

let listItemsStatement userId =
    sprintf "MATCH (u: User {userId: '%s'})-[:owns]->(i: Item) \
RETURN i LIMIT 1000"
        userId