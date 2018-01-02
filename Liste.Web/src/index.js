import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'node-fetch';
import './index.css';
import FontAwesome from './components/font-awesome.js';
import Section from './components/section.js';
import CreateItemSection from './components/create-item-section.js';
import classNames from 'classnames';

const apiHost = "http://localhost:8080";

function fetchStartupData() {
    return fetch(apiHost + '/startup');
}

function Title() {
    return (
        <div id="title">
            liste <FontAwesome iconName="hand-pointer-o" />
        </div>
    );
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isConnected: null,
            fbAccessToken: null,
            profilePicture: null,
            currentSection: null,//'add-object',
        };
    }

    componentDidMount() {
        // Facebook SDK loading
        // REF: https://medium.com/front-end-hacking/facebook-authorization-in-a-react-app-b7a9176aacb6
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: '154773301822164',
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v2.11'
            });

            // Get FB login status
            window.FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    console.log('Logged in.');
                }
                else {
                    window.FB.login();
                }
            });
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }

    onLoggedInFacebook(response) {
        console.log(response);
        this.setState({
            isConnected: true,
            fbAccessToken: response.accessToken,
        });

        fetch("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends&access_token=" + this.state.fbAccessToken)
            .then(response => response.json())
            .then(function (body) {
                this.setState({ profilePicture: body.picture.data.url })
            }.bind(this));
    }

    appearanceClass(sectionName) {
        if (this.state.currentSection === sectionName)
            return "section-is-active";
        else
            return "";
    }

    openSection(sectionName) {
        if (this.state.currentSection != sectionName)
            this.setState({ currentSection: sectionName });
        else
            this.closeSection();
    }

    closeSection() {
        this.setState({ currentSection: null });
    }

    render() {
        if (this.state.isConnected == null) {
            return <div className="container">
                <Title />
                <div className="global-msg-container">
                    <h1 className="debug">chargement...</h1>
                </div>
            </div>;
        }
        else if (this.state.isConnected === false) {
            return <div className="container">
                <Title />
                <div className="global-msg-container">
                    <h1>chargement...</h1>
                </div>
            </div>;
        }
        else {
            // 0) Install fetch to have an HTTP client
            // 0.1) Allow CORS in the API
            // 1) Charger liste d'amis
            // 2) Charger liste des objets disponibles
            // 3) Créer bot
            // 4) Envoyer photo à Bot

            return (
                <div className="container">
                    <Title />
                    {this.state.profilePicture &&
                        <img src={this.state.profilePicture} alt="" />}

                    <nav className={this.appearanceClass()}>
                        <a className="nav-item" onClick={() => this.openSection('add-object')}>&gt; proposer un objet</a>
                        <a className="nav-item" onClick={() => this.openSection('process-gift')}>&gt; conclure un deal</a>
                        <a className="nav-item" onClick={() => this.openSection('explore')}>&gt; explorer</a>
                    </nav>

                    {/* Section: add object */}
                    <CreateItemSection appearanceClass={this.appearanceClass("add-object")}
                                       onClose={() => this.closeSection()} />

                    {/* Section: process-gift */}
                    <Section appearanceClass={this.appearanceClass("process-gift")}
                             title="conclure un deal"
                             onClose={() => this.closeSection()} />

                    {/* Section: explorer */}
                    <Section appearanceClass={this.appearanceClass("explore")}
                             title="explorer"
                             onClose={() => this.closeSection()} />
                </div>
            );

            //<div><button onClick={() => this.setState({ isConnected: false }) }>Logout</button></div>
        }
    }
}

// ========================================

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
