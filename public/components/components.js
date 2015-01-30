var AccountsPage, AddStream, StreamsGroup, StreamsList, StreamsListItem;

AccountsPage = React.createClass({
  getInitialState: function() {
    return {
      streams: []
    };
  },
  componentDidMount: function() {
    var self;
    self = this;
    return $.getJSON('/api/getData').done(function(response) {
      if (self.isMounted()) {
        self.setState({
          streams: response.result
        });
        return util.namespacer('dosh.state').streams = response.result;
      }
    });
  },
  handleAddStreamClick: function() {
    return this.setState({
      addStreamOpen: true
    });
  },
  handleCloseAddStreamClick: function() {
    return this.setState({
      addStreamOpen: false
    });
  },
  handleAddStreamSubmit: function(evt) {
    evt.preventDefault();
    return this.setState({
      addStreamOpen: false
    });
  },
  render: function() {
    return React.createElement("div", {
      "className": "accounts"
    }, React.createElement("h2", null, "Accounts"), React.createElement("div", {
      "className": "actionBar"
    }, (this.state.addStreamOpen ? React.createElement("button", {
      "className": "btn secondary",
      "onClick": this.handleCloseAddStreamClick
    }, React.createElement("i", {
      "className": "fa fa-arrow-left"
    }), " Accounts") : React.createElement("button", {
      "className": "btn",
      "onClick": this.handleAddStreamClick
    }, React.createElement("i", {
      "className": "fa fa-plus"
    }), " Add Account"))), (this.state.addStreamOpen ? null : React.createElement(StreamsList, {
      "streams": this.state.streams
    })), (this.state.addStreamOpen ? React.createElement(AddStream, {
      "handleSubmit": this.handleAddStreamSubmit,
      "fields": []
    }) : null));
  }
});

StreamsList = React.createClass({
  getInitialState: function() {
    return null;
  },
  statics: {
    getTypeLabel: function(type) {
      return _.find(dosh.models.Stream.prototype.schema.streamType.choices, function(choice) {
        return choice[0] === type;
      })[1];
    },
    getSubtypeLabel: function(subtype) {
      return _.find(dosh.models.Stream.prototype.schema.streamSubtype.choices, function(choice) {
        return choice[0] === subtype;
      })[1];
    }
  },
  render: function() {
    var streamsByType;
    streamsByType = _.pairs(_.groupBy(this.props.streams, 'streamType'));
    return React.createElement("ul", {
      "className": "streams-list"
    }, streamsByType.map(function(type) {
      return React.createElement(StreamsGroup, {
        "key": type[0],
        "type": type[0],
        "streams": type[1]
      });
    }));
  }
});

StreamsGroup = React.createClass({
  render: function() {
    return React.createElement("li", {
      "className": "stream-group"
    }, React.createElement("h3", null, StreamsList.getTypeLabel(this.props.type)), React.createElement("ul", null, this.props.streams.map(function(stream) {
      return React.createElement(StreamsListItem, {
        "key": stream._id,
        "id": stream._id,
        "name": stream.name,
        "subtype": stream.streamSubtype
      });
    })));
  }
});

StreamsListItem = React.createClass({
  render: function() {
    return React.createElement("li", {
      "className": "item"
    }, React.createElement("div", {
      "className": "streamName"
    }, this.props.name), React.createElement("div", {
      "className": "streamType"
    }, StreamsList.getSubtypeLabel(this.props.subtype)));
  }
});

AddStream = React.createClass({
  statics: {
    getStreamFields: function() {
      return _.pairs(dosh.models.Stream.prototype.schema);
    }
  },
  render: function() {
    return React.createElement("form", {
      "className": "addStreamForm",
      "onSubmit": this.props.handleSubmit
    }, AddStream.getStreamFields().map(function(field) {
      return React.createElement("div", {
        "className": 'formRow cf ' + (field[1].input && field[1].input.type === 'checkbox' ? 'inline' : '')
      });
    }));
  }
});

"		ng-class=\"{formRow: true, cf: true, inline: (field.input.type === 'checkbox')}\"\n		ng-repeat=\"field in streamFields\"\n		ng-if=\"!field.showFor || (field.showFor && _.contains(field.showFor, newStream.type.typeKey))\"\n	>\n\n		<div class=\"field\">\n\n			<label\n				ng-if=\"field.input.type !== 'checkbox'\"\n				for=\"newStream-{{ field.jsName }}\"\n			>\n				{{ getStreamLabel(field.key, newStream.type.typeKey) }}\n			</label>\n\n			<input\n				ng-if=\"field.input.type !== 'select'\"\n				type=\"{{ field.input.type }}\"\n				id=\"newStream-{{ field.jsName }}\"\n				ng-model=\"newStream[field.jsName]\"\n				ng-required=\"field.validation.required\"\n			>\n\n			<label\n				ng-if=\"field.input.type === 'checkbox'\"\n				for=\"newStream-{{ field.jsName }}\"\n			>\n				{{ getStreamLabel(field.key, newStream.type.typeKey) }}\n			</label>\n\n			<select\n				ng-if=\"field.input.type === 'select' && field.key !== 'stream_subtype'\"\n				id=\"newStream-{{ field.jsName }}\"\n				ng-model=\"newStream[field.jsName]\"\n				ng-options=\"{{ getSelectOptions(field.key) }}\"\n				ng-required=\"field.validation.required\"\n			>\n				<option value=\"\">--- Choose {{ field.label | lowercase }} ---</option>\n			</select>\n\n			<select\n				ng-if=\"field.key === 'stream_subtype'\"\n				id=\"newStream-{{ field.jsName }}\"\n				ng-model=\"newStream[field.jsName]\"\n				ng-options=\"type.subName group by type.typeName for type in streamTypes\"\n				ng-required=\"field.validation.required\"\n				ng-change=\"setNewStream(newStream.type, newStream.name)\"\n			>\n				<option value=\"\">--- Choose {{ field.label | lowercase }} ---</option>\n			</select>\n\n		</div>\n\n		<p\n			ng-if=\"field.helpText\"\n			class=\"helpText aside\"\n		>\n			{{ getStreamHelp(field.key, newStream.type.typeKey) }}\n		</p>\n\n	</div>\n\n	<div class=\"actionBar\">\n		<button\n			class=\"btn secondary\"\n			ng-click=\"closeAddStream()\"\n		>\n			Cancel\n		</button>\n\n		<button\n			class=\"btn\"\n		>\n			<i class=\"fa fa-plus\"></i> Add Account\n		</button>\n	</div>\n\n</form>";

var App;

App = React.createClass({
  getInitialData: function() {
    return {
      isBlockingAjaxInProgress: false
    };
  },
  render: function() {
    return React.createElement("div", null, React.createElement("div", {
      "className": "topBar cf"
    }, React.createElement("header", null, React.createElement("a", {
      "href": "/"
    }, React.createElement("h1", null, "DoshCast"))), React.createElement(PrimaryNav, null), React.createElement(AuthControls, null)), (document.location.pathname === '/accounts' ? React.createElement(AccountsPage, null) : void 0), (document.location.pathname === '/ledger' ? React.createElement(LedgerPage, null) : void 0));
  }
});

var AuthControls, LoginButton, LoginPanel, RegisterButton, RegisterPanel;

AuthControls = React.createClass({
  getInitialState: function() {
    return {
      openPanel: null
    };
  },
  handleLoginClick: function() {
    return this.setState({
      openPanel: 'login'
    });
  },
  handleLoginSubmit: function(evt) {
    var data, self;
    evt.preventDefault();
    self = this;
    data = {};
    _.forEach($('.log-in-panel').serializeArray(), function(pair) {
      return data[pair.name] = pair.value;
    });
    data = {
      user: JSON.stringify(data)
    };
    return $.ajax({
      url: '/api/loginUser',
      data: data,
      dataType: 'json'
    }).done(function(response) {
      if (self.isMounted()) {
        if (!response.isError) {
          return self.handlePanelDismiss();
        }
      }
    });
  },
  handleRegisterClick: function() {
    return this.setState({
      openPanel: 'register'
    });
  },
  handleRegisterSubmit: function(evt) {
    return evt.preventDefault();
  },
  handlePanelDismiss: function() {
    return this.setState({
      openPanel: null
    });
  },
  render: function() {
    return React.createElement("div", {
      "className": "auth"
    }, React.createElement(LoginButton, {
      "clickHandler": this.handleLoginClick,
      "isPanelOpen": this.state.openPanel === 'login'
    }), (this.state.openPanel === 'login' ? React.createElement(LoginPanel, {
      "submitHandler": this.handleLoginSubmit,
      "dismissHandler": this.handlePanelDismiss
    }) : void 0), React.createElement(RegisterButton, {
      "clickHandler": this.handleRegisterClick,
      "isPanelOpen": this.state.openPanel === 'register'
    }), (this.state.openPanel === 'register' ? React.createElement(RegisterPanel, {
      "submitHandler": this.handleRegisterSubmit,
      "dismissHandler": this.handlePanelDismiss
    }) : void 0));
  }
});

LoginButton = React.createClass({
  render: function() {
    return React.createElement("button", {
      "className": 'log-in btn transparent ' + (this.props.isPanelOpen ? 'active' : ''),
      "onClick": this.props.clickHandler
    }, React.createElement("i", {
      "className": "fa fa-sign-in"
    }), " Log In");
  }
});

LoginPanel = React.createClass({
  getInitialState: function() {
    return {
      clickHandler: null
    };
  },
  componentWillMount: function() {
    var self;
    self = this;
    this.state.clickHandler = function(evt) {
      if ($(evt.target).closest('.log-in-panel').length === 0) {
        return self.props.dismissHandler();
      }
    };
    return window.$document.on('click', this.state.clickHandler);
  },
  componentDidMount: function() {
    return $('.log-in-panel input').first().focus();
  },
  componentWillUnmount: function() {
    return window.$document.off('click', this.state.clickHandler);
  },
  render: function() {
    return React.createElement("form", {
      "method": "post",
      "className": "panel log-in-panel",
      "onSubmit": this.props.submitHandler
    }, React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", {
      "htmlFor": "loginEmail"
    }, "E-mail address"), React.createElement("input", {
      "type": "email",
      "id": "loginEmail",
      "name": "email",
      "autoCorrect": "off",
      "autoCapitalize": "off"
    })), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", {
      "htmlFor": "loginPassword"
    }, "\t\t\t\t\tPassword"), React.createElement("input", {
      "type": "password",
      "id": "loginPassword",
      "name": "password"
    })), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", null, React.createElement("input", {
      "type": "checkbox",
      "name": "loginRemember"
    }), "\t\t\t\t\tRemember me")), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("button", {
      "className": "btn",
      "type": "submit"
    }, React.createElement("i", {
      "className": "fa fa-sign-in"
    }), " Log In")), React.createElement(CloseButton, {
      "closeAction": this.props.dismissHandler
    }));
  }
});

RegisterButton = React.createClass({
  render: function() {
    return React.createElement("button", {
      "className": 'register btn transparent ' + (this.props.isPanelOpen ? 'active' : ''),
      "onClick": this.props.clickHandler
    }, React.createElement("i", {
      "className": "fa fa-user"
    }), " Register");
  }
});

RegisterPanel = React.createClass({
  getInitialState: function() {
    return {
      clickHandler: null
    };
  },
  componentWillMount: function() {
    var self;
    self = this;
    this.state.clickHandler = function(evt) {
      if ($(evt.target).closest('.register-panel').length === 0) {
        return self.props.dismissHandler();
      }
    };
    return window.$document.on('click', this.state.clickHandler);
  },
  componentDidMount: function() {
    return $('.register-panel input').first().focus();
  },
  componentWillUnmount: function() {
    return window.$document.off('click', this.state.clickHandler);
  },
  render: function() {
    return React.createElement("form", {
      "method": "post",
      "className": "panel register-panel",
      "onSubmit": this.props.submitHandler
    }, React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", {
      "htmlFor": "registerEmail"
    }, "E-mail address"), React.createElement("input", {
      "type": "email",
      "id": "registerEmail",
      "name": "email",
      "autoCorrect": "off",
      "autoCapitalize": "off"
    })), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", {
      "htmlFor": "registerPassword"
    }, "\t\t\t\t\tPassword"), React.createElement("input", {
      "type": "password",
      "id": "registerPassword",
      "name": "password"
    })), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("label", {
      "htmlFor": "registerPassword2"
    }, "\t\t\t\t\tPassword (again)"), React.createElement("input", {
      "type": "password",
      "id": "registerPassword2",
      "name": "password"
    })), React.createElement("div", {
      "className": "formRow"
    }, React.createElement("button", {
      "className": "btn",
      "type": "submit"
    }, React.createElement("i", {
      "className": "fa fa-user"
    }), " Register")), React.createElement(CloseButton, {
      "closeAction": this.props.dismissHandler
    }));
  }
});

"<div\n	class=\"auth\"\n	ng-cloak\n	ng-controller=\"AuthController\"\n>\n\n	<button\n		class=\"log-in btn\"\n		ng-click=\"handleLoginClick()\"\n		ng-if=\"!user.isLoggedIn\"\n	>\n		<i class=\"fa fa-sign-in\"></i> Log In\n	</button>\n	<form\n		method=\"post\"\n		data-url=\"{% url 'api' version=\"1\" method=\"loginUser\" %}\"\n		class=\"panel log-in-panel\"\n		ng-if=\"loginPanelOpen && !user.isLoggedIn\"\n		ng-submit=\"handleLoginSubmit()\"\n	>\n		<div class=\"formRow\">\n			<label for=\"loginUsername\">\n				Username\n			</label>\n			<input type=\"text\" id=\"loginUsername\" name=\"username\" autoCorrect=\"off\" autoCapitalize=\"off\">\n		</div>\n		<div class=\"formRow\">\n			<label for=\"loginPassword\">\n				Password\n			</label>\n			<input type=\"password\" id=\"loginPassword\" name=\"password\">\n		</div>\n		<div class=\"formRow\">\n			<label>\n				<input type=\"checkbox\" name=\"loginRemember\">\n				Remember me\n			</label>\n		</div>\n		<div class=\"formRow\">\n			<button\n				class=\"btn\"\n				type=\"submit\"\n			>\n				<i class=\"fa fa-sign-in\"></i> Log In\n			</button>\n		</div>\n	</form>\n\n	<button\n		class=\"sign-up btn\"\n		ng-click=\"handleSignupClick()\"\n		ng-if=\"!user.isLoggedIn\"\n	>\n		<i class=\"fa fa-user\"></i> Sign Up\n	</button>\n	<form\n		method=\"post\"\n		data-url=\"{% url 'api' version=\"1\" method=\"createUser\" %}\"\n		class=\"panel sign-up-panel\"\n		ng-if=\"signupPanelOpen && !user.isLoggedIn\"\n		ng-submit=\"handleSignupSubmit()\"\n	>\n		<div class=\"formRow\">\n			<label for=\"signupUsername\">\n				Username\n			</label>\n			<input type=\"text\" id=\"signupUsername\" name=\"username\" autoComplete=\"off\" autoCorrect=\"off\" autoCapitalize=\"off\">\n		</div>\n		<div class=\"formRow\">\n			<label for=\"signupEmail\">\n				E-mail Address\n			</label>\n			<input type=\"email\" id=\"signupEmail\" name=\"email\" autoComplete=\"off\">\n		</div>\n		<div class=\"formRow\">\n			<label for=\"signupPassword\">\n				Password\n			</label>\n			<input type=\"password\" id=\"signupPassword\" name=\"password\" autoComplete=\"off\">\n		</div>\n		<div class=\"formRow\">\n			<label for=\"signupRePassword\">\n				Password (again)\n			</label>\n			<input type=\"password\" id=\"signupRePassword\" name=\"\" autoComplete=\"off\">\n		</div>\n		<div class=\"formRow\">\n			<button\n				class=\"btn\"\n				type=\"submit\"\n			>\n				<i class=\"fa fa-user\"></i> Sign Up\n			</button>\n		</div>\n	</form>\n\n	<form\n		data-url=\"{% url 'api' version=\"1\" method=\"logoutUser\" %}\"\n		class=\"log-out\"\n		ng-if=\"user.isLoggedIn\"\n	>\n		<p class=\"loggedInAs\">\n			You are logged in as {% verbatim %}{{ user.username }}{% endverbatim %}.\n		</p>\n		<button\n			class=\"btn\"\n			ng-click=\"handleLogoutClick()\"\n		>\n			<i class=\"fa fa-sign-out fa-flip-horizontal\"></i> Log Out\n		</button>\n	</form>\n\n</div>";

var Ledger;

Ledger = React.createClass({
  render: function() {
    return React.createElement("p", null, "Hello world. I am the ledger.");
  }
});

var PrimaryNav;

PrimaryNav = React.createClass({
  render: function() {
    return React.createElement("nav", {
      "className": "primary-nav"
    }, React.createElement("ul", {
      "className": "cf"
    }, React.createElement("li", {
      "className": (document.location.pathname === '/dashboard' ? 'active' : '')
    }, React.createElement("a", {
      "href": "/dashboard"
    }, React.createElement("span", null, React.createElement("i", {
      "className": "fa fa-tasks"
    }), " Dashboard"))), React.createElement("li", {
      "className": (document.location.pathname === '/accounts' ? 'active' : '')
    }, React.createElement("a", {
      "href": "/accounts"
    }, React.createElement("span", null, React.createElement("i", {
      "className": "fa fa-bank"
    }), " Accounts"))), React.createElement("li", {
      "className": (document.location.pathname === '/ledger' ? 'active' : '')
    }, React.createElement("a", {
      "href": "/ledger"
    }, React.createElement("span", null, React.createElement("i", {
      "className": "fa fa-calendar"
    }), " Ledger"))), React.createElement("li", {
      "className": (document.location.pathname === '/goals' ? 'active' : '')
    }, React.createElement("a", {
      "href": "/goals"
    }, React.createElement("span", null, React.createElement("i", {
      "className": "fa fa-rocket"
    }), " Goals"))), React.createElement("li", {
      "className": (document.location.pathname === '/projections' ? 'active' : '')
    }, React.createElement("a", {
      "href": "/projection"
    }, React.createElement("span", null, React.createElement("i", {
      "className": "fa fa-line-chart"
    }), " Projection")))));
  }
});

var CloseButton, LoadingMask;

CloseButton = React.createClass({
  handleClick: function(evt) {
    evt.preventDefault();
    return this.props.closeAction();
  },
  render: function() {
    return React.createElement("button", {
      "className": "close",
      "onClick": this.handleClick
    }, React.createElement("i", {
      "className": "fa fa-times"
    }));
  }
});

LoadingMask = React.createClass({
  render: function() {
    return React.createElement("div", {
      "className": "loading-mask"
    }, React.createElement("div", {
      "class": "center-icon"
    }, React.createElement("i", {
      "className": "fa fa-circle-o-notch fa-spin"
    })));
  }
});
