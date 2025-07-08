export interface IExternalPerson {
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

export interface IOtherExternalPersonData {
    id:                 number;
    name:               string;
    height?:            number;
    mass?:              number;
    gender:             Gender;
    homeworld?:         string[] | string;
    wiki:               string;
    image:              string;
    born?:              number | string;
    bornLocation?:      string;
    died?:              number;
    diedLocation?:      string;
    species:            string;
    hairColor?:         string;
    eyeColor:           string;
    skinColor?:         string;
    cybernetics?:       string[] | string;
    affiliations:       string[];
    masters?:           string[] | string;
    apprentices?:       string[] | string;
    formerAffiliations: string[];
    dateCreated?:       number;
    dateDestroyed?:     number;
    destroyedLocation?: string;
    creator?:           string;
    manufacturer?:      string;
    model?:             string;
    class?:             string;
    sensorColor?:       string;
    platingColor?:      string;
    equipment?:         string[] | string;
    productLine?:       string;
    kajidic?:           string;
    era?:               string[] | string;
    degree?:            string;
    armament?:          string[] | string;
}

export enum Gender {
    Female = "female",
    Hermaphrodite = "hermaphrodite",
    Male = "male",
    NA = "n/a",
    None = "none"
}
