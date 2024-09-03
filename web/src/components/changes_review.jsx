// Monocle.
// Copyright (C) 2019-2020 Monocle authors

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import React from 'react'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import ListGroup from 'react-bootstrap/ListGroup'
import PropTypes from 'prop-types'

import { hasSmallWidth } from './common'

import { Line } from 'react-chartjs-2'

import moment from 'moment'

function secondsToDhms(seconds) {
  const d = moment.duration()
  d.add(seconds, 'second')
  return d.humanize()
}

class ChangeReviewEventsHisto extends React.Component {
  prepareDataSet(histos) {
    const eventNameMapping = {
      ChangeCommentedEvent: {
        label: 'Commented',
        pointBorderColor: 'rgba(247,242,141,1)',
        pointBackgroundColor: '#fff',
        backgroundColor: 'rgba(247,242,141,0.4)',
        borderColor: 'rgba(247,242,141,1)'
      },
      ChangeReviewedEvent: {
        label: 'Reviewed',
        pointBorderColor: 'rgba(247,141,141,1)',
        pointBackgroundColor: '#fff',
        backgroundColor: 'rgba(247,141,141,0.4)',
        borderColor: 'rgba(247,141,141,1)'
      }
    }
    const _histos = Object.entries(histos)
    const data = {
      labels: histos.ChangeCommentedEvent.map((x) => x.date),
      datasets: []
    }
    _histos.forEach((histo) => {
      data.datasets.push({
        label: eventNameMapping[histo[0]].label,
        data: histo[1].map((x) => x.count),
        lineTension: 0.5,
        pointBorderColor: eventNameMapping[histo[0]].pointBorderColor,
        pointBackgroundColor: eventNameMapping[histo[0]].pointBackgroundColor,
        backgroundColor: eventNameMapping[histo[0]].backgroundColor,
        borderColor: eventNameMapping[histo[0]].borderColor
      })
    })
    return data
  }

  render() {
    const data = this.prepareDataSet({
      ChangeCommentedEvent: this.props.comment,
      ChangeReviewedEvent: this.props.review
    })
    return (
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Line
                data={data}
                width={100}
                // on small screen the legend takes the whole height so detect and adjust
                height={hasSmallWidth() ? 90 : 68}
                options={{
                  legend: {
                    labels: {
                      boxWidth: 30
                    }
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    )
  }
}

ChangeReviewEventsHisto.propTypes = {
  review: PropTypes.any,
  comment: PropTypes.any
}

const ChangesReviewStats = (prop) => (
  <Row>
    <Col md={3}>
      <ListGroup>
        <ListGroup.Item>
          {prop.data.comment_count.events_count} changes commented by{' '}
          {prop.data.comment_count.authors_count} authors
        </ListGroup.Item>
        <ListGroup.Item>
          {prop.data.review_count.events_count} changes reviewed by{' '}
          {prop.data.review_count.authors_count} authors
        </ListGroup.Item>
        <ListGroup.Item>
          Mean time for the first comment:{' '}
          {secondsToDhms(prop.data.comment_delay)}
        </ListGroup.Item>
        <ListGroup.Item>
          Mean time for the first review:{' '}
          {secondsToDhms(prop.data.review_delay)}
        </ListGroup.Item>
      </ListGroup>
    </Col>
    <Col md={9}>
      <ChangeReviewEventsHisto
        comment={prop.comment_histo}
        review={prop.review_histo}
      />
    </Col>
  </Row>
)

export { ChangesReviewStats }
