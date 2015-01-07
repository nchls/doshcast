var AccountsList, AccountsPage;

AccountsPage = React.createClass({
  getInitialState: function() {
    return {
      accounts: []
    };
  },
  componentDidMount: function() {
    var self;
    self = this;
    return qwest.get('/api/getData').then(function(response) {
      if (self.isMounted()) {
        response = JSON.parse(response);
        return self.setState({
          accounts: response.result
        });
      }
    });
  },
  render: function() {
    return React.createElement("div", null, React.createElement("h2", null, "Accounts"), React.createElement(AccountsList, {
      "accounts": this.state.accounts
    }));
  }
});

AccountsList = React.createClass({
  getInitialState: function() {
    return null;
  },
  render: function() {
    return React.createElement("ul", null, this.props.accounts.map(function(account) {
      return React.createElement("li", {
        "key": account._id
      }, account.name);
    }));
  }
});

var Ledger;

Ledger = React.createClass({
  render: function() {
    return React.createElement("p", null, "Hello world. I am the ledger.");
  }
});
