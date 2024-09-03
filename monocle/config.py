# Monocle.
# Copyright (C) 2019-2020 Monocle authors
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import os
import yaml

from typing import Dict, List, Optional
from jsonschema import validate as schema_validate
from jsonschema import draft7_format_checker

from monocle.ident import IdentsConfig, ident_from_config
from monocle.task_data import TaskCrawler, createTaskCrawler
from monocle.config_pb2 import ProjectDefinition

schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "github_provider": {
            "title": "Github provider",
            "type": "object",
            "required": ["github_token", "github_organization"],
            "properties": {
                "github_token": {"type": "string"},
                "github_organization": {
                    "description": "The organization name",
                    "type": "string",
                },
                "github_repositories": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
        },
        "gitlab_provider": {
            "title": "Gitlab provider",
            "type": "object",
            "required": ["gitlab_token"],
            "properties": {
                "gitlab_token": {"type": "string"},
            },
        },
        "gerrit_provider": {
            "title": "Gerrit provider",
            "type": "object",
            "required": ["gerrit_url"],
            "properties": {
                "gerrit_url": {
                    "description": "The repository name or regexp",
                    "type": "string",
                },
                "gerrit_url_insecure": {
                    "description": "Set to true to bypass the HTTP X509 certificate verification",
                    "type": "boolean",
                },
                "gerrit_repositories": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "gerrit_prefix": {
                    "description": "Repository name prefix in case of name collision",
                    "type": "string",
                },
            },
        },
        "crawler": {
            "title": "Monocle crawler",
            "description": "A crawler definition",
            "type": "object",
            "required": ["name", "update_since", "provider"],
            "properties": {
                "name": {"type": "string"},
                "update_since": {"type": "string", "format": "date"},
                "provider": {
                    "oneOf": [
                        {"$ref": "#/definitions/gerrit_provider"},
                        {"$ref": "#/definitions/github_provider"},
                        {"$ref": "#/definitions/gitlab_provider"},
                        {"type": "string"},
                    ],
                },
            },
        },
    },
    "type": "object",
    "properties": {
        "tenants": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["index"],
                "properties": {
                    "index": {
                        "type": "string",
                        "description": "Elasticsearch index name",
                    },
                    "users": {
                        "description": "User authorized to see and access the index",
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "idents": {
                        "description": "Identity aliases",
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["ident", "aliases"],
                            "properties": {
                                "ident": {"type": "string"},
                                "aliases": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                        },
                    },
                    "crawlers_api_key": {"type": "string"},
                    "crawlers": {
                        "type": "array",
                        "items": {"$ref": "#/definitions/crawler"},
                    },
                    "projects": {
                        "description": "Project definition",
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "repository_regex": {"type": "string"},
                                "branch_regex": {"type": "string"},
                                "file_regex": {"type": "string"},
                            },
                        },
                    },
                },
            },
        }
    },
}


def maybeToList(maybe):
    return [maybe] if maybe else None


def listFromMaybe(maybe):
    return maybe if maybe else []


def removeEmpty(obj):
    if isinstance(obj, list):
        return [removeEmpty(x) for x in obj if x]
    elif isinstance(obj, dict):
        return dict([(k, removeEmpty(v)) for k, v in obj.items() if v])
    else:
        return obj


migrate_command = "monocle migrate-config --config <config-path>"


def get_env(name):
    if not os.environ.get(name):
        print("[ERROR] Could not find secret from environment name: ", name)
        exit(1)
    return os.environ[name]


def downgrade(tenant):
    """Take a v1.0 configuration and return a v0.9 (for existing crawler)"""
    if tenant.get("crawlers", None) is None:
        print(
            "[WARNING] tenant %s still use v0.9 config format, migrate using %s"
            % (tenant["index"], migrate_command)
        )
        tenant = upgrade(tenant)

    crawlers = tenant.pop("crawlers", [])
    tenant["task_crawlers"] = []
    tenant["crawler"] = dict(loop_delay=300, github_orgs=[], gerrit_repositories=[])
    tenant["index"] = tenant.pop("name")

    github_app_defined = False

    for crawler in crawlers:
        provider = crawler["provider"]
        if (
            provider == "TaskDataProvider"
            or provider.get("bugzilla_url")
            or provider.get("github_repositories")
        ):
            key = get_env(tenant.get("crawlers_api_key", "CRAWLERS_API_KEY"))
            tenant["task_crawlers"].append(
                dict(
                    name=crawler["name"],
                    updated_since=crawler["update_since"],
                    api_key=key,
                )
            )
        if provider == "TaskDataProvider":
            continue
        if provider.get("github_organization"):
            key = get_env(provider.get("github_token", "GITHUB_TOKEN"))
            for repo in provider.get("github_repositories", [None]):
                tenant["crawler"]["github_orgs"].append(
                    dict(
                        updated_since=crawler["update_since"],
                        name=provider["github_organization"],
                        token=key,
                        repository=repo,
                        base_url=provider["github_url"]
                        if provider.get("github_url")
                        else "https://github.com",
                    )
                )
        elif provider.get("github_app_organization"):
            if github_app_defined:
                print("ERROR: only one github app is currently supported")
                exit(1)
            github_app_defined = True
            os.environ["APP_ID"] = get_env(
                provider.get("github_app_id", "GITHUB_APP_ID")
            )
            os.environ["APP_KEY_PATH"] = get_env(
                provider.get("github_app_key_path", "GITHUB_APP_KEY_PATH")
            )
            for repo in provider.get("github_app_repositories", [None]):
                tenant["crawler"]["github_orgs"].append(
                    dict(
                        updated_since=crawler["update_since"],
                        name=provider["github_app_organization"],
                        repository=repo,
                        base_url=provider["github_app_url"]
                        if provider.get("github_app_url")
                        else "https://github.com",
                    )
                )
        elif provider.get("gerrit_url"):
            if provider.get("gerrit_password"):
                key = get_env(provider.get("gerrit_password", "GERRIT_PASSWORD"))
            else:
                key = None
            for repo in listFromMaybe(provider.get("gerrit_repositories")):
                tenant["crawler"]["gerrit_repositories"].append(
                    dict(
                        updated_since=crawler["update_since"],
                        name=repo,
                        base_url=provider["gerrit_url"],
                        insecure=provider.get("gerrit_url_insecure"),
                        login=provider.get("gerrit_login"),
                        password=key,
                        prefix=provider.get("gerrit_prefix"),
                    )
                )

    tenant.pop("crawlers_api_key", None)
    return removeEmpty(tenant)


env_counter = dict(current=0)
assigned_env: Dict[str, str] = dict()


def fresh_env(for_key):
    if for_key in assigned_env:
        return assigned_env[for_key]
    env_counter["current"] += 1
    env = "MONOCLE_SECRET" + str(env_counter["current"])
    assigned_env[for_key] = env
    os.environ[env] = for_key
    return env


def upgrade(tenant):
    """Take a v0.9 configuration and return a v1.0"""
    if not tenant.get("index"):
        print("Invalid workspace, it is missing the index key:", tenant)
        exit(1)
    crawlers = tenant.get("crawlers", [])

    # Add github crawlers
    legacy_crawler = tenant.pop("crawler", {})
    for crawler in legacy_crawler.get("github_orgs", []):
        if crawler.get("base_url", "") == "https://github.com":
            crawler.pop("base_url")
        if os.getenv("APP_ID"):
            os.environ["GITHUB_APP_ID"] = os.environ["APP_ID"]
            os.environ["GITHUB_APP_KEY_PATH"] = os.environ["APP_KEY_PATH"]
            provider = dict(
                github_app_url=crawler.get("base_url"),
                github_app_organization=crawler["name"],
                github_app_repositories=maybeToList(crawler.get("repository")),
            )
        else:
            env = fresh_env(crawler["token"])
            provider = dict(
                github_url=crawler.get("base_url"),
                github_token=env,
                github_organization=crawler["name"],
                github_repositories=maybeToList(crawler.get("repository")),
            )
        crawlers.append(
            dict(
                name="github-" + crawler["name"],
                update_since=crawler["updated_since"],
                provider=provider,
            )
        )

    # Add gerrit crawlers
    for (pos, crawler) in enumerate(legacy_crawler.get("gerrit_repositories", [])):
        if crawler.get("password"):
            env = fresh_env(crawler["password"])
        else:
            env = None
        crawlers.append(
            dict(
                name="gerrit-" + str(pos + 1),
                update_since=crawler["updated_since"],
                provider=dict(
                    gerrit_url=crawler["base_url"],
                    gerrit_login=crawler.get("login"),
                    gerrit_password=env,
                    gerrit_url_insecure=crawler.get("insecure"),
                    gerrit_prefix=crawler.get("prefix"),
                    gerrit_repositories=maybeToList(crawler.get("name")),
                ),
            )
        )

    # Add tasks crawlers
    for crawler in tenant.pop("task_crawlers", []):
        if (
            tenant.get("crawlers_api_key")
            and tenant["crawlers_api_key"] != crawler["api_key"]
        ):
            print("[WARNING]: Could not migrate multiple tasks crawlers api key")
            print("Only one crawlers_api_key is now supported per tenant.")
            # TODO: should we fail here?
        os.environ["CRAWLERS_API_KEY"] = crawler["api_key"]
        tenant["crawlers_api_key"] = "CRAWLERS_API_KEY"
        crawlers.append(
            dict(
                name=crawler["name"],
                update_since=crawler["updated_since"],
                provider="TaskDataProvider",
            )
        )

    tenant["crawlers"] = crawlers
    tenant["name"] = tenant.pop("index")
    return removeEmpty(tenant)


def get_envs(config):
    return [(v + "=" + k) for (k, v) in assigned_env.items()]


def get_workspaces(conf):
    return conf.get("workspaces", conf.get("tenants", []))


def loadUpgrade(content):
    conf = yaml.safe_load(content)
    return dict(workspaces=[upgrade(ws) for ws in get_workspaces(conf)])


def load(content):
    conf = yaml.safe_load(content)
    # We always downgrade the config for the apiv1 so that we can keep the
    # existing crawler unmodified.
    return dict(tenants=[downgrade(ws) for ws in get_workspaces(conf)])


def validate(data, schema):
    schema_validate(
        instance=data,
        schema=schema,
        format_checker=draft7_format_checker,
    )


class Username(str):
    pass


def get_project_by_name(
    name: str, lp: List[ProjectDefinition]
) -> Optional[ProjectDefinition]:
    projects = [p for p in lp if p.name == name]
    if projects:
        return projects[0]
    else:
        return None


def build_index_task_crawlers(
    config: dict,
) -> Dict[str, List[TaskCrawler]]:
    ret = {}
    for tenant in get_workspaces(config):
        if "task_crawlers" in tenant.keys():
            ret[tenant["index"]] = [
                createTaskCrawler(entry) for entry in tenant["task_crawlers"]
            ]
    return ret


def get_idents_config(config: dict, index_name: str) -> IdentsConfig:
    matches = list(
        filter(lambda tenant: tenant["index"] == index_name, config["tenants"])
    )
    if len(matches) > 0:
        return list(map(ident_from_config, matches[0].get("idents", [])))
    else:
        return []


def build_project_definitions(config: dict) -> Dict[str, List[ProjectDefinition]]:
    indexes_project_def: Dict[str, List[ProjectDefinition]] = {}
    for tenant in get_workspaces(config):
        if "projects" not in tenant.keys():
            indexes_project_def[tenant["index"]] = []
        else:
            indexes_project_def[tenant["index"]] = [
                ProjectDefinition(
                    name=p["name"],
                    repository_regex=p.get("repository_regex"),
                    branch_regex=p.get("branch_regex"),
                    file_regex=p.get("file_regex"),
                )
                for p in tenant["projects"]
            ]
    return indexes_project_def
