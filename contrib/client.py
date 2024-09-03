# Copyright (C) 2021 Monocle authors
# SPDX-License-Identifier: AGPL-3.0-or-later

# An example client to query the api using the protobuf helpers.
# Checkout the `client-requests.py` for a simpler version without dependencies.

import argparse
import json
import monocle.webapi as M
import monocle.crawler_pb2 as Crawler
import monocle.change_pb2 as Change


def usage():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url")
    parser.add_argument("action", choices=["workspaces", "query", "add-td"])
    parser.add_argument("params", nargs="*")
    return parser.parse_args()


args = usage()

# Query workspaces:
if args.action == "workspaces":
    print(M.config_get_workspaces(args.url, M.GetWorkspacesRequest()))

# Query changes:
elif args.action == "query":
    try:
        (workspace, query) = tuple(args.params)
    except:
        print("usage: query workspace query")
        exit(1)
    query = M.QueryRequest(
        index=workspace, query=query, query_type=M.QueryRequest.QUERY_CHANGE
    )
    resp = M.search_query(args.url, query)
    if resp.error.message:
        print(resp)
    else:
        for change in resp.changes.changes:
            print(change.url, change.title)

# Add task data to a change
elif args.action == "add-td":
    try:
        (workspace, crawler, apikey, td) = tuple(args.params)
    except:
        print("usage: add-td workspace crawler apikey json")
        exit(1)
    tdjson = json.loads(td)
    td = Change.TaskData(**tdjson)
    entity = Crawler.Entity(td_name=crawler)
    query = M.AddDocRequest(
        index=workspace, crawler=crawler, apikey=apikey, entity=entity, task_datas=[td]
    )
    resp = M.crawler_add_doc(args.url, query)
    print(resp)
