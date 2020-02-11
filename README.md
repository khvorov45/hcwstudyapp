
<!-- README.md is generated from README.Rmd. Please edit that file -->

# hcwstudyapp

<!-- badges: start -->

[![Travis build
status](https://travis-ci.org/khvorov45/hcwstudyapp.svg?branch=master)](https://travis-ci.org/khvorov45/hcwstudyapp)
<!-- badges: end -->

The goal of `hcwstudyapp` is to provide access for investigators to the
data collected for the repeated vaccinations healthcare worker project.

## Installation

``` r
devtools::install_github("khvorov45/hcwstudyapp")
```

## Data access

The data is stored on RedCap servers. This app accesses it via an API
token. The token is not stored anywhere in code or in this repository.

To see any data while using the app you need to input either the API
token or (more conveniently) a password. Neither is stored in code or on
the repository.

The `data-raw` folder creates hash values for the token and the
password. The hashes are stored as internal package data.

When the app is run it needs the API token and the key used to create
the internal hashes. It will hash the given token using the given key
and compare the hash value to the internal hash. They will only match if
the token/key combination given is the same as the one that was used to
create the internal hash. The app will not run if hashes don’t match.

After the app runs, when the password is entered it is also hashed using
the given key and the hash value is compared to the internal one. They
will only match if the password is correct.
