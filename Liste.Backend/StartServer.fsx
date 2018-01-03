#load "Scripts/load-project-debug.fsx"

open Liste.Backend
open Suave
open FSharp.Data

Http.RequestString("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends",
    headers=seq ["Authorization", sprintf "Bearer %s" "EAACMwZCetAtQBAGXX1FEHYozfh6yY94jw9r88SXrdYpKPAUL8YwRNQZBaY8Sd51Ah8yAd86ZCSu4RfoJjXbBHlIPeeZAFl3rL6yO0guaTv4iZCZA2WSXKZCopZCLt4A4KPVMVyha5jWL86UuZCGQW3dMy0b08LowczPmmfpo8Mm9pD7dJbWYUqbcoB1v4C9h7TTQ0ZAHljU4P9HgZDZD"])

startWebServer defaultConfig app