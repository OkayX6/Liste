import React from 'react';
import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import fetch from 'node-fetch';
import './index.css';

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
        //fetchStartupData()
        //    .then(response => response.json())
        //    .then(function (body) {
        //        this.setState({ profilePicture: body.picture });
        //    }.bind(this));
    }

    sectionClass() {
        if (this.state.route != null)
            return "active";
        else
            return "inactive";
    }

    navClass() {
        if (this.state.route != null)
            return "active";
        else
            return "";
    }

    toggleRoute(routeName) {
        if (this.state.route == null)
            this.setState({ route: routeName });
        else
            this.setState({ route: null });
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
                    {this.state.profilePicture &&
                        <img src={this.state.profilePicture} />}

                    <nav className={this.navClass()}>
                        <a className="nav-item" href="#add-object" onClick={() => !this.state.route && this.toggleRoute('add-object')}>&gt; ajouter objet</a>
                        <a className="nav-item" href="#process-gift" onClick={() => !this.state.route && this.toggleRoute('process-gift')}>&gt; conclure don</a>
                        <a className="nav-item" href="#explore" onClick={() => !this.state.route && this.toggleRoute('explore')}>&gt; explorer</a>
                    </nav>

                    <section className={this.sectionClass()}>
                        <header>ajouter object</header>
                    </section>

                    <div><button onClick={() => this.setState({ isConnected: false }) }>Logout</button></div>
                </div>
            );
        }
    }
}

// ========================================

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
