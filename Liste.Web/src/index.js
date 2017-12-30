import React from 'react';
import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import fetch from 'node-fetch';
import './index.css';

// Font Awesome
// REF: https://stackoverflow.com/questions/23116591/how-to-include-a-font-awesome-icon-in-reacts-render
import 'font-awesome/css/font-awesome.min.css';

import classNames from 'classnames';

const apiHost = "http://localhost:8080";

function fetchStartupData() {
    return fetch(apiHost + '/startup');
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isConnected: true,
            fbAccessToken: null,
            profilePicture: null,
            currentSection: null,
        };
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

    appearanceClass() {
        return classNames({ 'section-is-active': this.state.currentSection != null });
    }

    openSection(sectionName) {
        if (this.state.currentSection == null)
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
                <h1>loading...</h1>
                <FacebookLogin hidden="true"
                    appId="154773301822164"
                    autoLoad={true}
                    scope="public_profile,user_friends"
                    callback={(response) => this.onLoggedInFacebook(response)} />
            </div>;
        }
        else if (this.state.isConnected === false) {
            return <div className="container">
                <h1>Pas connecté</h1>
                <FacebookLogin
                    appId="154773301822164"
                    autoLoad={true}
                    scope="public_profile,user_friends"
                    callback={(response) => this.onLoggedInFacebook(response)} />
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
                    <div id="title" className={this.appearanceClass()}>
                        liste <i className="fa fa-hand-pointer-o" aria-hidden="true"></i> 
                    </div>
                    {this.state.profilePicture &&
                        <img src={this.state.profilePicture} />}

                    <nav className={this.appearanceClass()}>
                        <a className="nav-item" href="#add-object" onClick={() => this.openSection('add-object')}>&gt; proposer un objet</a>
                        <a className="nav-item" href="#process-gift" onClick={() => this.openSection('process-gift')}>&gt; conclure un deal</a>
                        <a className="nav-item" href="#explore" onClick={() => this.openSection('explore')}>&gt; explorer</a>
                    </nav>

                    <section className={this.appearanceClass()}>
                        <div>
                        </div>
                        <a className="button" href="#" onClick={() => this.closeSection()}>
                            fermer <i className="fa fa-arrow-right" aria-hidden="true"></i>
                        </a>

                        <header>proposer un objet</header>

                        <div>sldkfjlskdfj</div>

                        <form>
                        </form>
                    </section>

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
