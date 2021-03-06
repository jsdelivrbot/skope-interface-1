import React from 'react';
import PropTypes from 'prop-types';

class NavbarItem extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
  };

  render () {
    const {
      label,
      url,
    } = this.props;

    return typeof url === 'undefined'
    ? (
      <label>{label}</label>
    )
    : (
      <a href={url}>{label}</a>
    );
  }
}

export default class Navbar extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.object),
  };

  render () {
    const {
      items,
    } = this.props;

    if (!items || items.length === 0) {
      return null;
    }

    return (
      <div>
        {items.map((item, index, list) => (
          <span key={index}>
            <NavbarItem {...item} />
            {(index < (list.length - 1))
            ? <span>&nbsp;&gt;&nbsp;</span>
            : null}
          </span>
        ))}
      </div>
    );
  }
}
