import React from 'react';
import FontAwesome from './font-awesome.js';

export default function(props) {
    return (
        <section className={props.appearanceClass}>
            <div className="section-header-part">
                <a className="section-close-button" href="#" onClick={props.onClose}>
                    fermer <FontAwesome iconName="arrow-right" />
                </a>
                <div className="section-header-title">{props.title}</div>
            </div>

            <div className="section-content-part">
                <div className="left-part"></div>
                <div className="right-part">
                    {props.children}
                </div>
            </div>
        </section>
    );
}