DROP TABLE IF EXISTS countries;

CREATE TABLE countries
(
    id SERIAL PRIMARY KEY,
    country VARCHAR(255),
    cCases VARCHAR(255),
    dCaese VARCHAR(255),
    rCaese VARCHAR(255),
    date VARCHAR(255)
)