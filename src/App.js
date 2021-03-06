import React, { Component } from "react";
import classnames from "classnames";
import { Map, InfoWindow, Marker, GoogleApiWrapper } from "google-maps-react";
import escapeRegExp from "escape-string-regexp";
import "./index.css";
import SideBar from "./Sidebar.js";
import mapStyle from "./map-style.json";

export class MapApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      showingInfoWindow: false,
      activeMarker: {},
      selectedPlace: {},
      query: "",
      markers: [],
      active: false,
      full: true,
      isLoading: false,
      ariaExpanded: false,
      queryItems: [],
      error: null
    };
  }

  // `classList.toggle` showed Errors so Used 'classnames' to handle it & Burger Menu `aria-expanded` handling
  toggleMenu = () => {
    if (
      this.state.active === false &&
      this.state.full === true &&
      this.state.ariaExpanded === false
    ) {
      this.setState({
        active: true,
        full: false,
        ariaExpanded: true
      });
    } else {
      this.setState({
        active: false,
        full: true,
        ariaExpanded: false
      });
    }
  };

  gm_authFailure() {
    document.querySelector("body").innerText =
      "Error loading Google Maps, Check The API Key!";
    alert("Error loading Google Maps, Check The API Key!");
  }

  componentDidMount() {
    fetch(
      "https://api.foursquare.com/v2/venues/explore?client_id=GOCZGJUBBXCSCUFF4QTUIH0FTXP35RXALJOFHL22DHVBGR5Q&client_secret=WKSOXP1FDMQI2V4P552VEVYO2XBPKQVKA114NUYFTBFWXH2P&v=20180323&limit=6&ll=53.4631,-2.291398&query=Manchester United",
      {
        method: "GET"
      }
    )
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          // When FourSquare API fails >> alert
          alert("FourSquare API can't load!");
        }
      })
      .then(res => {
        this.setState({
          items: res.response.groups[0].items,
          queryItems: res.response.groups[0].items,
          isLoading: false
        });
      })
      // When Response error >> alert and console
      .catch(error => {
        this.setState({ error, isLoading: false });
        console.log("Error! " + error);
        alert("Error! " + error);
      });

    window.gm_authFailure = this.gm_authFailure.bind(this);
  }

  createMarkers = marker => {
    if (marker !== null) this.state.markers.push(marker);
  };

  // When click on Marker: Open InfoWindow
  onMarkerClick = (props, items) =>
    this.setState({
      selectedPlace: props,
      activeMarker: items,
      showingInfoWindow: true
    });

  // When click on Map: Close active InfoWindow
  onMapClicked = () => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      });
    }
  };

  // When Click On Side Nav Location
  onListClick = e => {
    let markers;

    // `.gmnoprint` works fine on touch screens & `.gmnoprint map area` works fine on Desktop
    (() => {
      if (window.matchMedia("(max-width: 1024px)").matches) {
        markers = [...document.querySelectorAll(".gmnoprint")];
      } else {
        markers = [...document.querySelectorAll(".gmnoprint map area")];
      }
    })();

    this.setState({ markers: markers });
    const click = markers.find(marker => marker.title === e.innerText);
    click.click();
  };

  // Search filtering locations
  filterList = query => {
    let input, inputVal, a, i, filtered;
    input = document.querySelector("#search");
    inputVal = input.value.toLowerCase();
    a = document.querySelectorAll(".nav-item");

    for (i = 0; i < a.length; i++) {
      filtered = a[i];

      if (filtered.innerHTML.toLowerCase().indexOf(inputVal) > -1) {
        filtered.style.display = "";
      } else {
        filtered.style.display = "none";
      }
    }
    this.setState({ query: query });
  };

  render() {
    const style = { width: "100%", height: "100%" };
    // `classList.toggle` showed Errors so Used 'classnames' to handle it
    let activeClass = classnames("nav-section ", {
      active: this.state.active
    });
    let fullClass = classnames("map-canvas ", {
      full: this.state.full
    });

    const { isLoading, error } = this.state;
    if (error) {
      return <p>{error.message}</p>;
    }
    if (isLoading) {
      return <p>Loading ...</p>;
    }

    let queryItems;
    if (this.state.query) {
      const match = new RegExp(escapeRegExp(this.state.query), "i");
      queryItems = this.state.items.filter(item => match.test(item.venue.name));
    } else {
      queryItems = this.state.items;
    }

    return (
      <div>
        <header className="header-bar" role="banner">
          {/* Burger Menu */}
          <nav className="buttonNav" role="presentation">
            <button
              className={"toggleButton"}
              aria-controls="menu"
              aria-expanded={this.state.ariaExpanded}
              onClick={this.toggleMenu.bind(this)}
              aria-label="BurgerMenu to open Locations list"
            >
              <span />
              <span />
              <span />
            </button>
          </nav>

          <h1>Manchester United Map</h1>
        </header>

        <SideBar
          items={this.state.items}
          onListClick={this.onListClick}
          filterList={this.filterList}
          queryItems={this.state.queryItems}
          activeClass={activeClass}
          query={this.state.query}
        />

        <div className={fullClass} aria-label="Google Map" role="application">
          <Map
            google={this.props.google}
            style={style}
            styles={mapStyle}
            initialCenter={{ lat: 53.4631, lng: -2.29139 }}
            zoom={16}
            onClick={this.onMapClicked}
            aria-hidden="true"
          >
            {/* Create Location List of Markers from fetching API data */}
            {queryItems.map(item => {
              return (
                <Marker
                  name={item.venue.name}
                  ref={this.state.createMarkers}
                  title={item.venue.name}
                  key={item.venue.id + Math.random() * 0.17}
                  address={item.venue.location.formattedAddress.join(", ")}
                  className="marker-pin"
                  position={{
                    lat: item.venue.location.lat,
                    lng: item.venue.location.lng
                  }}
                  animation={
                    this.state.activeMarker
                      ? this.state.activeMarker.name === item.venue.name
                        ? "1"
                        : "0"
                      : "0"
                  }
                  onClick={this.onMarkerClick}
                />
              );
            })}

            <InfoWindow
              tabIndex="0"
              aria-label="Info window"
              marker={this.state.activeMarker}
              visible={this.state.showingInfoWindow}
            >
              <div tabIndex="1">
                <h4 tabIndex="1">{this.state.selectedPlace.name}</h4>
                <p tabIndex="1">{this.state.selectedPlace.address}</p>
              </div>
            </InfoWindow>
          </Map>
        </div>
      </div>
    );
  }
}

export default GoogleApiWrapper(
  {
    apiKey: "AIzaSyDr2mpFQ0YiKrf8bW71BurYN_QIl6uylys",
    v: "3.30"
  },
  window.addEventListener("unhandledrejection", event => {
    console.warn(
      "WARNING: Unhandled promise rejection. Shame on you! Reason: " +
        event.reason
    );
    document.querySelector("body").innerHTML = "The Google Maps didn't load!";
  })
)(MapApp);
