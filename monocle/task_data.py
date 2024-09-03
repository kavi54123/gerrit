# Monocle.
# Copyright (C) 2019-2021 Monocle authors
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

from typing import List, Optional, Dict
from dataclasses import dataclass
from datetime import datetime
import monocle.search_pb2 as PBTD


@dataclass(frozen=True)
class TaskData:
    crawler_name: Optional[str]
    updated_at: Optional[datetime]
    change_url: str
    ttype: List[str]
    tid: str
    url: str
    title: str
    severity: Optional[str] = None
    priority: Optional[str] = None
    score: Optional[int] = None


def toTaskData(crawler: str, ntd: PBTD.TaskData) -> TaskData:
    return TaskData(
        crawler,
        ntd.updated_at.ToDatetime(),
        ntd.change_url,
        list(ntd.ttype),
        ntd.tid,
        ntd.url,
        ntd.title,
        ntd.severity,
        ntd.priority,
        ntd.score,
    )


InputTaskData = List[TaskData]


@dataclass
class TaskCrawler:
    name: str
    api_key: str
    updated_since: datetime


def createInputTaskData(data: List, crawler_name: str) -> InputTaskData:
    dtf = "%Y-%m-%dT%H:%M:%SZ"

    def validate(td: Dict) -> None:
        err = []
        for m_field in (
            "updated_at",
            "change_url",
            "ttype",
            "tid",
            "url",
            "title",
        ):
            if m_field not in td:
                err.append("Missing mandatory field: %s" % m_field)
        if err:
            raise ValueError("\n".join(err))
        try:
            datetime.strptime(td["updated_at"], dtf)
        except Exception as e:
            err.append("Wrong date format: %s" % e)
        if not isinstance(td["ttype"], list) or not all(
            [isinstance(o, str) for o in td["ttype"]]
        ):
            err.append("issue_type must be a list of str")
        for str_field in (
            "change_url",
            "tid",
            "url",
            "title",
            "severity",
            "priority",
        ):
            if str_field in td and (
                not isinstance(td[str_field], str) or not td[str_field]
            ):
                err.append("Field: %s must be Str and not empty" % str_field)
        if "score" in td and not not isinstance(td["score"], int):
            err.append("Field: score must be Int")
        if err:
            raise ValueError("\n".join(err))

    def createTaskData(td: Dict) -> TaskData:
        validate(td)
        return TaskData(
            crawler_name=crawler_name,
            updated_at=datetime.strptime(td["updated_at"], dtf),
            change_url=td["change_url"],
            ttype=td["ttype"],
            tid=td["tid"],
            url=td["url"],
            title=td["title"],
            severity=td.get("severity"),
            priority=td.get("priority"),
            score=td.get("score"),
        )

    return [createTaskData(td) for td in data]


def createELTaskData(data: List) -> InputTaskData:
    def createTaskData(td: Dict) -> TaskData:
        return TaskData(
            crawler_name=td.get("crawler_name"),
            updated_at=td.get("updated_at"),
            change_url=td["change_url"],
            ttype=td["ttype"],
            tid=td["tid"],
            url=td["url"],
            title=td["title"],
            severity=td.get("severity"),
            priority=td.get("priority"),
            score=td.get("score"),
        )

    return [createTaskData(td) for td in data]


def createTaskCrawler(raw: Dict) -> TaskCrawler:
    return TaskCrawler(
        name=raw["name"],
        api_key=raw["api_key"],
        updated_since=datetime.strptime(raw["updated_since"], "%Y-%m-%d"),
    )


@dataclass
class TaskDataForEL:
    _id: str
    tasks_data: InputTaskData


@dataclass
class OrphanTaskDataForEL:
    _id: str
    task_data: TaskData


@dataclass
class AdoptedTaskData:
    _adopted: bool


@dataclass
class AdoptedTaskDataForEL:
    _id: str
    task_data: AdoptedTaskData
