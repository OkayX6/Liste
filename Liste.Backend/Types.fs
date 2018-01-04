namespace Liste.Backend.Types

type UserAuthInfo = {
    UserId: string
    AccessToken: string
}

type UserInfo = {
    Name: string
    PictureUrl: string
    Friends: string[]
}

type Item = {
    Description: string
    PictureFileName: string
}
