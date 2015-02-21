import React from 'react';
var BaseChart = require('./BaseChart');

class TopListChart extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: { labels: [], series: []}
        };
    }

    componentWillReceiveProps(props) {
        let unit   = props.unit;
        let counts = props.counts.sort((a,b) => a[unit] - b[unit]);

        this.setState({
            data: {
                labels: counts.map(e => e.key),
                series: counts.length ? [counts.map(e => e[unit])] : []
            }
        });
    }

    render() {
        let isHorizontal = this.props.orientation === 'horizontal';
        let chartOptions = {
            chartPadding: 0,
            horizontalBars: isHorizontal,
            reverseData: !isHorizontal,
            axisX: {
                showGrid: isHorizontal,
                labelInterpolationFnc: this.formatValue.bind(this)
            },
            axisY: {
                showGrid: !isHorizontal,
                labelInterpolationFnc: this.formatValue.bind(this)
            }
        };

        return (
            <div className="top-list-chart">
                <h3>{this.props.title}</h3>

                <BaseChart
                    type="Bar"
                    data={this.state.data}
                    aspectRatio="major-sixth"
                    options={chartOptions}
                />
            </div>
        );
    }

    formatValue(value) {
        if (typeof value === 'number') {
            return this.props.unit === 'pct' ? `${value.toFixed(2)}%` : value;
        } else {
            return value;
        }
    }

}

TopListChart.propTypes = {
    title: React.PropTypes.string.isRequired,
    counts: React.PropTypes.array.isRequired,
    unit: React.PropTypes.string.isRequired
};

module.exports = TopListChart;
