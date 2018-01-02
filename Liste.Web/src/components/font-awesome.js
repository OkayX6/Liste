import React from 'react';
// Font Awesome
// REF: https://stackoverflow.com/questions/23116591/how-to-include-a-font-awesome-icon-in-reacts-render
import 'font-awesome/css/font-awesome.min.css';

// Functional FontAwesome component
export default function(props) {
    var iconClass = "fa fa-" + props.iconName;
    return (<i className={iconClass}></i>);
}