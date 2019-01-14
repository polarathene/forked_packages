"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

// Handle legacy names for image queries.
var convertProps = function convertProps(props) {
  var convertedProps = (0, _extends2.default)({}, props);

  if (convertedProps.resolutions) {
    convertedProps.fixed = convertedProps.resolutions;
    delete convertedProps.resolutions;
  }

  if (convertedProps.sizes) {
    convertedProps.fluid = convertedProps.sizes;
    delete convertedProps.sizes;
  }

  return convertedProps;
}; // Cache if we've seen an image before so we don't both with
// lazy-loading & fading in on subsequent mounts.


var imageCache = {};

var inImageCache = function inImageCache(props) {
  var convertedProps = convertProps(props); // Find src

  var src = convertedProps.fluid ? convertedProps.fluid.src : convertedProps.fixed.src;
  return imageCache[src] || false;
};

var activateCacheForImage = function activateCacheForImage(props) {
  var convertedProps = convertProps(props); // Find src

  var src = convertedProps.fluid ? convertedProps.fluid.src : convertedProps.fixed.src;
  imageCache[src] = true;
};

var io;
var listeners = [];

function getIO() {
  if (typeof io === "undefined" && typeof window !== "undefined" && window.IntersectionObserver) {
    io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        listeners.forEach(function (l) {
          if (l[0] === entry.target) {
            // Edge doesn't currently support isIntersecting, so also test for an intersectionRatio > 0
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              io.unobserve(l[0]);
              l[1]();
            }
          }
        });
      });
    }, {
      rootMargin: "200px"
    });
  }

  return io;
}

var listenToIntersections = function listenToIntersections(el, cb) {
  getIO().observe(el);
  listeners.push([el, cb]);
};

var noscriptImg = function noscriptImg(props) {
  // Check if prop exists before adding each attribute to the string output below to prevent
  // HTML validation issues caused by empty values like width="" and height=""
  var src = props.src ? "src=\"" + props.src + "\" " : "src=\"\" "; // required attribute

  var sizes = props.sizes ? "sizes=\"" + props.sizes + "\" " : "";
  var srcSetWebp = props.srcSetWebp ? "<source type='image/webp' srcSet=\"" + props.srcSetWebp + "\" " + sizes + "/>" : "";
  var srcSet = props.srcSet ? "<source srcSet=\"" + props.srcSet + "\" " + sizes + "/>" : "";
  var title = props.title ? "title=\"" + props.title + "\" " : "";
  var alt = props.alt ? "alt=\"" + props.alt + "\" " : "alt=\"\" "; // required attribute

  var width = props.width ? "width=\"" + props.width + "\" " : "";
  var height = props.height ? "height=\"" + props.height + "\" " : "";
  var opacity = props.opacity ? props.opacity : "1";
  var transitionDelay = props.transitionDelay ? props.transitionDelay : "0.5s";
  return "<picture>" + srcSetWebp + srcSet + "<img " + width + height + src + alt + title + "style=\"position:absolute;top:0;left:0;transition:opacity 0.5s;transition-delay:" + transitionDelay + ";opacity:" + opacity + ";width:100%;height:100%;object-fit:cover;object-position:center\"/></picture>";
};

var Img = _react.default.forwardRef(function (props, ref) {
  var style = props.style,
      onLoad = props.onLoad,
      onError = props.onError,
      otherProps = (0, _objectWithoutPropertiesLoose2.default)(props, ["style", "onLoad", "onError"]);
  return _react.default.createElement("img", (0, _extends2.default)({}, otherProps, {
    onLoad: onLoad,
    onError: onError,
    ref: ref,
    style: (0, _extends2.default)({
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center"
    }, style)
  }));
});

Img.propTypes = {
  style: _propTypes.default.object,
  onError: _propTypes.default.func,
  onLoad: _propTypes.default.func
};

var Image =
/*#__PURE__*/
function (_React$Component) {
  (0, _inheritsLoose2.default)(Image, _React$Component);

  function Image(props) {
    var _this;

    _this = _React$Component.call(this, props) || this; // default settings for browser without Intersection Observer available

    var isVisible = true;
    var imgLoaded = false;
    var IOSupported = false;
    var fadeIn = props.fadeIn; // If this image has already been loaded before then we can assume it's
    // already in the browser cache so it's cheap to just show directly.

    var seenBefore = inImageCache(props); // browser with Intersection Observer available

    if (!seenBefore && typeof window !== "undefined" && window.IntersectionObserver) {
      isVisible = false;
      IOSupported = true;
    } // Never render image during SSR


    if (typeof window === "undefined") {
      isVisible = false;
    } // Force render for critical images


    if (props.critical) {
      isVisible = true;
      IOSupported = false;
    }

    var hasNoScript = !(_this.props.critical && !_this.props.fadeIn);
    _this.state = {
      isVisible: isVisible,
      imgLoaded: imgLoaded,
      IOSupported: IOSupported,
      fadeIn: fadeIn,
      hasNoScript: hasNoScript,
      seenBefore: seenBefore
    };
    _this.imageRef = _react.default.createRef();
    _this.handleImageLoaded = _this.handleImageLoaded.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));
    _this.handleRef = _this.handleRef.bind((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));
    return _this;
  }

  var _proto = Image.prototype;

  _proto.componentDidMount = function componentDidMount() {
    if (this.state.isVisible && typeof this.props.onStartLoad === "function") {
      this.props.onStartLoad({
        wasCached: inImageCache(this.props)
      });
    }

    if (this.props.critical) {
      var img = this.imageRef.current;

      if (img && img.complete) {
        this.handleImageLoaded();
      }
    }
  };

  _proto.handleRef = function handleRef(ref) {
    var _this2 = this;

    if (this.state.IOSupported && ref) {
      listenToIntersections(ref, function () {
        if (!_this2.state.isVisible && typeof _this2.props.onStartLoad === "function") {
          _this2.props.onStartLoad({
            wasCached: inImageCache(_this2.props)
          });
        }

        _this2.setState({
          isVisible: true,
          imgLoaded: false
        });
      });
    }
  };

  _proto.handleImageLoaded = function handleImageLoaded() {
    activateCacheForImage(this.props);
    this.setState({
      imgLoaded: true
    });

    if (this.state.seenBefore) {
      this.setState({
        fadeIn: false
      });
    }

    this.props.onLoad && this.props.onLoad();
  };

  _proto.render = function render() {
    var _convertProps = convertProps(this.props),
        title = _convertProps.title,
        alt = _convertProps.alt,
        className = _convertProps.className,
        _convertProps$style = _convertProps.style,
        style = _convertProps$style === void 0 ? {} : _convertProps$style,
        _convertProps$imgStyl = _convertProps.imgStyle,
        imgStyle = _convertProps$imgStyl === void 0 ? {} : _convertProps$imgStyl,
        _convertProps$placeho = _convertProps.placeholderStyle,
        placeholderStyle = _convertProps$placeho === void 0 ? {} : _convertProps$placeho,
        placeholderClassName = _convertProps.placeholderClassName,
        fluid = _convertProps.fluid,
        fixed = _convertProps.fixed,
        backgroundColor = _convertProps.backgroundColor,
        Tag = _convertProps.Tag;

    var bgColor = typeof backgroundColor === "boolean" ? "lightgray" : backgroundColor;
    var imagePlaceholderStyle = (0, _extends2.default)({
      opacity: this.state.imgLoaded ? 0 : 1,
      transition: "opacity 0.5s",
      transitionDelay: this.state.imgLoaded ? "0.5s" : "0.25s"
    }, imgStyle, placeholderStyle);
    var imageStyle = (0, _extends2.default)({
      opacity: this.state.imgLoaded || this.state.fadeIn === false ? 1 : 0,
      transition: this.state.fadeIn === true ? "opacity 0.5s" : "none"
    }, imgStyle);
    var placeholderImageProps = {
      title: title,
      alt: !this.state.isVisible ? alt : "",
      style: imagePlaceholderStyle,
      className: placeholderClassName
    };

    if (fluid) {
      var image = fluid;
      return _react.default.createElement(Tag, {
        className: (className ? className : "") + " gatsby-image-wrapper",
        style: (0, _extends2.default)({
          position: "relative",
          overflow: "hidden"
        }, style),
        ref: this.handleRef,
        key: "fluid-" + JSON.stringify(image.srcSet)
      }, _react.default.createElement(Tag, {
        style: {
          width: "100%",
          paddingBottom: 100 / image.aspectRatio + "%"
        }
      }), image.base64 && _react.default.createElement(Img, (0, _extends2.default)({
        src: image.base64
      }, placeholderImageProps)), image.tracedSVG && _react.default.createElement(Img, (0, _extends2.default)({
        src: image.tracedSVG
      }, placeholderImageProps)), bgColor && _react.default.createElement(Tag, {
        title: title,
        style: {
          backgroundColor: bgColor,
          position: "absolute",
          top: 0,
          bottom: 0,
          opacity: !this.state.imgLoaded ? 1 : 0,
          transitionDelay: "0.35s",
          right: 0,
          left: 0
        }
      }), this.state.isVisible && _react.default.createElement("picture", null, image.srcSetWebp && _react.default.createElement("source", {
        type: "image/webp",
        srcSet: image.srcSetWebp,
        sizes: image.sizes
      }), _react.default.createElement("source", {
        srcSet: image.srcSet,
        sizes: image.sizes
      }), _react.default.createElement(Img, {
        alt: alt,
        title: title,
        src: image.src,
        style: imageStyle,
        ref: this.imageRef,
        onLoad: this.handleImageLoaded,
        onError: this.props.onError
      })), this.state.hasNoScript && _react.default.createElement("noscript", {
        dangerouslySetInnerHTML: {
          __html: noscriptImg((0, _extends2.default)({
            alt: alt,
            title: title
          }, image))
        }
      }));
    }

    if (fixed) {
      var _image = fixed;
      var divStyle = (0, _extends2.default)({
        position: "relative",
        overflow: "hidden",
        display: "inline-block",
        width: _image.width,
        height: _image.height
      }, style);

      if (style.display === "inherit") {
        delete divStyle.display;
      }

      return _react.default.createElement(Tag, {
        className: (className ? className : "") + " gatsby-image-wrapper",
        style: divStyle,
        ref: this.handleRef,
        key: "fixed-" + JSON.stringify(_image.srcSet)
      }, _image.base64 && _react.default.createElement(Img, (0, _extends2.default)({
        src: _image.base64
      }, placeholderImageProps)), _image.tracedSVG && _react.default.createElement(Img, (0, _extends2.default)({
        src: _image.tracedSVG
      }, placeholderImageProps)), bgColor && _react.default.createElement(Tag, {
        title: title,
        style: {
          backgroundColor: bgColor,
          width: _image.width,
          opacity: !this.state.imgLoaded ? 1 : 0,
          transitionDelay: "0.25s",
          height: _image.height
        }
      }), this.state.isVisible && _react.default.createElement("picture", null, _image.srcSetWebp && _react.default.createElement("source", {
        type: "image/webp",
        srcSet: _image.srcSetWebp,
        sizes: _image.sizes
      }), _react.default.createElement("source", {
        srcSet: _image.srcSet,
        sizes: _image.sizes
      }), _react.default.createElement(Img, {
        alt: alt,
        title: title,
        width: _image.width,
        height: _image.height,
        src: _image.src,
        style: imageStyle,
        ref: this.imageRef,
        onLoad: this.handleImageLoaded,
        onError: this.props.onError
      })), this.state.hasNoScript && _react.default.createElement("noscript", {
        dangerouslySetInnerHTML: {
          __html: noscriptImg((0, _extends2.default)({
            alt: alt,
            title: title,
            width: _image.width,
            height: _image.height
          }, _image))
        }
      }));
    }

    return null;
  };

  return Image;
}(_react.default.Component);

Image.defaultProps = {
  critical: false,
  fadeIn: true,
  alt: "",
  Tag: "div"
};

var fixedObject = _propTypes.default.shape({
  width: _propTypes.default.number.isRequired,
  height: _propTypes.default.number.isRequired,
  src: _propTypes.default.string.isRequired,
  srcSet: _propTypes.default.string.isRequired,
  base64: _propTypes.default.string,
  tracedSVG: _propTypes.default.string,
  srcWebp: _propTypes.default.string,
  srcSetWebp: _propTypes.default.string
});

var fluidObject = _propTypes.default.shape({
  aspectRatio: _propTypes.default.number.isRequired,
  src: _propTypes.default.string.isRequired,
  srcSet: _propTypes.default.string.isRequired,
  sizes: _propTypes.default.string.isRequired,
  base64: _propTypes.default.string,
  tracedSVG: _propTypes.default.string,
  srcWebp: _propTypes.default.string,
  srcSetWebp: _propTypes.default.string
});

Image.propTypes = {
  resolutions: fixedObject,
  sizes: fluidObject,
  fixed: fixedObject,
  fluid: fluidObject,
  fadeIn: _propTypes.default.bool,
  title: _propTypes.default.string,
  alt: _propTypes.default.string,
  className: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]),
  // Support Glamor's css prop.
  critical: _propTypes.default.bool,
  style: _propTypes.default.object,
  imgStyle: _propTypes.default.object,
  placeholderStyle: _propTypes.default.object,
  placeholderClassName: _propTypes.default.string,
  backgroundColor: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.bool]),
  onLoad: _propTypes.default.func,
  onError: _propTypes.default.func,
  onStartLoad: _propTypes.default.func,
  Tag: _propTypes.default.string
};
var _default = Image;
exports.default = _default;