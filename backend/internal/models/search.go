package models

type SearchResult struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
    Type string `json:"type"`
    Slug string `json:"slug"`
}
