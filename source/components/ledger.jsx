var LedgerPage = React.createClass({
	getInitialState: function() {
		return {
			streams: AppActions.getStreams()
		};
	},

	componentWillMount: function() {
		var self = this;
		self.eventListeners = [];
		self.addListener('addStream', self.handleDataUpdate);
		self.addListener('editStream', self.handleDataUpdate);
		self.addListener('updateData', self.handleDataUpdate);
	},

	componentWillUnmount: function() {
		_.forEach(this.eventListeners, function(listener) {
			events.removeListener(listener.event, listener.callback);
		});
	},

	addListener: function(event, callback) {
		events.addListener(event, callback);
		this.eventListeners.push({
			event: event,
			callback: callback
		});
	},

	handleDataUpdate: function() {
		this.setState({
			streams: AppActions.getStreams()
		});
	},

	render: function() {
		var self = this;
		return <div className="ledger">
			<h2>Ledger</h2>
			<div className="actionBar">

			</div>
			<Ledger streams={self.state.streams}/>
		</div>;
	}
});

var Ledger = React.createClass({
	getInitialState: function() {
		return {
			ledger: [],
			manuals: [],
			revisions: [],
			streams: [],
			subStreams: []
		};
	},

	componentWillReceiveProps: function(nextProps) {
		this.setLedgerData(nextProps);
	},

	setLedgerData: function(props) {
		var ledgerData = dosh.services.ledger.getLedgerData({ streams: props.streams }),
			subStreams;

		perf.start('FORMATTING');
		ledgerData.ledger = this.formatLedgerTable(ledgerData.ledger);
		subStreams = this.prepLedgerHeader(ledgerData.streams);
		perf.end('FORMATTING');

		this.setState({
			ledger: ledgerData.ledger,
			manuals: ledgerData.manuals,
			revisions: ledgerData.revisions,
			streams: ledgerData.streams,
			subStreams: subStreams
		});
	},

	formatLedgerTable: function(ledger) {
		perf.start('formatLedgerTable');

		var row,
			subColumns = [
				['payment', 'Payment'],
				['spending', 'Spending'],
				['balance', 'Balance'],
				['carriedBalance', 'Carried Balance'],
				['interest', 'Interest'],
				['accruedInterest', 'Accrued Interest'],
			];

		_.forEach(ledger, function(dayEntry, index) {
			ledger[index].printDate = dayEntry.moment.format('MMM D');
			ledger[index].fullDate = dayEntry.moment.format('dddd, MMMM Do, YYYY');
			row = [];
			_.forEach(dayEntry.streams, function(streamEntry) {
				_.forEach(subColumns, function(subCol) {
					if (streamEntry.hasOwnProperty(subCol[0])) {
						row.push({
							val: streamEntry[subCol[0]]
						});
					}
				});
			});
			ledger[index].row = row;
		});

		perf.end('formatLedgerTable');
		return ledger;
	},

	prepLedgerHeader: function(streams) {
		perf.start('prepLedgerHeader');

		var subStreams = [],
			columnLabels;
		_.forEach(streams, function(stream) {
			if (stream.columns.length > 1) {
				columnLabels = _.pluck(stream.columns, 1);
				subStreams = subStreams.concat(columnLabels);
			}
		});

		perf.end('prepLedgerHeader');
		return subStreams;
	},

	render: function() {
		if (this.state.streams.length === 0) {
			return null;
		}
		return <table>
			<thead>
				<tr>
					<th className="date" rowSpan="2">Date</th>
					{this.state.streams.map(function(stream) {
						return <th className="stream" key={stream._id} colSpan={stream.columns.length} rowSpan={(stream.columns.length === 1 ? 2 : 1)}>
							{stream.name}
						</th>;
					})}
				</tr>
				<tr>
					{this.state.subStreams.map(function(subStream, index) {
						return <th className="subStream" key={index}>{subStream}</th>;
					})}
				</tr>
			</thead>
			<tbody>
				{this.state.ledger.map(function(entry) {
					return <tr key={entry.ymd}>
						<td className="date" title={entry.fullDate}>
							{entry.printDate}
						</td>
						{entry.row.map(function(column, index) {
							return <td className="stream" key={index}>
								{column.val}
							</td>;
						})}
					</tr>;
				})}
			</tbody>
		</table>;
	}
});

/*
			<table id="ledger-table">
				<thead>
				</thead>
				<tbody>
					<tr
						ng-repeat="(date, entry) in ledger track by $index"
						data-date="{{ date }}"
					>
						<td
							class="date"
							title="{{ entry.fullDate }}"
						>
							{{ entry.printDate }}
						</td>
						<td
							class="stream"
							ng-repeat="column in entry.row track by $index"
						>
							{{ column.val }}
						</td>
					</tr>
				</tbody>
			</table>
 */