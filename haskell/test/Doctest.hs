module Main (main) where

import Test.DocTest

main :: IO ()
main = doctest (opts <> ["-isrc", "src/"])
  where
    opts :: [String]
    opts =
      map
        (mappend "-X")
        [ "BangPatterns",
          "ConstraintKinds",
          "DeriveGeneric",
          "DerivingStrategies",
          "FlexibleInstances",
          "FlexibleContexts",
          "GeneralizedNewtypeDeriving",
          "LambdaCase",
          "MultiWayIf",
          "MultiParamTypeClasses",
          "NamedFieldPuns",
          "NamedWildCards",
          "NoImplicitPrelude",
          "NumDecimals",
          "NumericUnderscores",
          "OverloadedStrings",
          "PatternSynonyms",
          "QuasiQuotes",
          "RecordWildCards",
          "ScopedTypeVariables",
          "TypeApplications",
          "TypeOperators"
        ]
