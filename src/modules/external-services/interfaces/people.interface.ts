export interface Person {
    name:       string;
    height:     string;
    mass:       string;
    hair_color: string;
    skin_color: string;
    eye_color:  string;
    birth_year: string;
    gender:     Gender;
    homeworld:  string;
    films:      string[];
    species:    string[];
    vehicles:   string[];
    starships:  string[];
    created:    Date;
    edited:     Date;
    url:        string;
}

export enum Gender {
    Female = "female",
    Hermaphrodite = "hermaphrodite",
    Male = "male",
    NA = "n/a",
    None = "none",
}
