// Copyright (C) 2021 Monocle authors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A library for monocle web
//

open Prelude

// Monocle nav
module MonoLink = {
  @react.component
  let make = (~store: Store.t, ~filter: string, ~path: string, ~name: string) => {
    let (state, dispatch) = store
    let base = "/" ++ state.index ++ "/" ++ path ++ "?"
    let query = switch state.query {
    | "" => ""
    | query => "q=" ++ query ++ "&"
    }
    let href = base ++ query ++ "f=" ++ filter

    let onClick = e => {
      e->ReactEvent.Mouse.preventDefault
      filter->Store.Store.SetFilter->dispatch
      href->RescriptReactRouter.push
    }
    <a onClick style={ReactDOM.Style.make(~whiteSpace="nowrap", ())} href> {name->str} </a>
  }
}

module Direct = {
  @react.component
  let make = (~link: string, ~name: string) => {
    let onClick = e => {
      e->ReactEvent.Mouse.preventDefault
      link->RescriptReactRouter.push
    }
    <a href={link} onClick> {name->str} </a>
  }
}

let default = MonoLink.make
