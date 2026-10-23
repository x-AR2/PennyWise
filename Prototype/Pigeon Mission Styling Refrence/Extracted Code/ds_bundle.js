/* @ds-bundle: {"format":4,"namespace":"PigeonSMissionDesignSystem_870423","components":[{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"}],"sourceHashes":{"components/brand/Wordmark.jsx":"22232a6ae73a","components/core/Button.jsx":"53ee13996b15","components/navigation/Footer.jsx":"2063f79a3d66","components/navigation/NavBar.jsx":"f69dbb3d91a7"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PigeonSMissionDesignSystem_870423 = window.PigeonSMissionDesignSystem_870423 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The Pigeon's Mission wordmark, as a transparent PNG cut from the key art.
 * `tone="color"` is the blue-over-red lockup; `"ink"` and `"white"` are flat single-colour.
 * `base` is the path to this design system's assets/ folder, relative to the consuming page.
 */
function Wordmark({
  tone = 'color',
  width = 280,
  base = '../../assets/',
  style,
  ...rest
}) {
  const file = tone === 'ink' ? 'wordmark-ink.png' : tone === 'white' ? 'wordmark-white.png' : 'wordmark.png';
  return /*#__PURE__*/React.createElement("img", _extends({}, rest, {
    src: base + 'logo/' + file,
    alt: "Pigeon's Mission",
    style: {
      width,
      display: 'block',
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZE = {
  sm: {
    p: '8px 20px',
    fs: 14
  },
  md: {
    p: '14px 32px',
    fs: 18
  },
  lg: {
    p: '18px 44px',
    fs: 22
  }
};

/** Primary = red gradient with the sticker stack. Secondary = ink fill with a mint keyline. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  as = 'button',
  href,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const s = SIZE[size] || SIZE.md;
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: s.p,
    fontFamily: 'var(--font-body)',
    fontSize: s.fs,
    fontWeight: 700,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: 'var(--border-width) solid var(--pm-ink)',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `transform var(--dur-press) var(--ease-out), box-shadow var(--dur-hover) var(--ease-out), background var(--dur-hover) var(--ease-out)`,
    opacity: disabled ? 0.45 : 1,
    transform: disabled ? 'none' : down ? 'translate(3px,3px)' : hover ? 'translate(0,-2px)' : 'none'
  };
  const skin = primary ? {
    background: down ? 'var(--pm-maroon)' : 'var(--pm-grad-red)',
    color: 'var(--pm-white)',
    boxShadow: down ? '1px 1px 0 var(--pm-ink)' : `${hover ? '6px 8px' : '4px 4px'} 0 var(--pm-ink)`,
    textShadow: '0 1px 0 rgba(34,22,54,.45)'
  } : ghost ? {
    background: 'transparent',
    color: 'var(--pm-ink)',
    border: 'var(--border-width) solid transparent',
    boxShadow: 'none',
    textDecoration: hover ? 'underline' : 'none',
    textDecorationThickness: '3px',
    textUnderlineOffset: '4px'
  } : {
    background: down ? 'var(--pm-navy)' : 'var(--pm-ink)',
    color: 'var(--pm-blush)',
    boxShadow: down ? '1px 1px 0 var(--pm-ink)' : `${hover ? '6px 8px' : '4px 4px'} 0 var(--pm-ink)`
  };
  const Tag = href ? 'a' : as;
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    href: href,
    disabled: as === 'button' && !href ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      ...base,
      ...skin,
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Site footer. The one place the studio name is allowed to appear alongside contact and copyright. */
function Footer({
  columns = [],
  tagline = 'He cannot fly. He is going anyway.',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({}, rest, {
    style: {
      background: 'var(--pm-ink)',
      borderTop: '4px solid var(--pm-mint)',
      padding: 'var(--space-8) var(--space-6) var(--space-6)',
      color: 'var(--pm-sky)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-8)',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 320,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    width: 180
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--body-sm-size)',
      color: 'var(--pm-blush)'
    }
  }, tagline)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-8)',
      flexWrap: 'wrap'
    }
  }, columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--label-size)',
      fontWeight: 'var(--label-weight)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--pm-mint)'
    }
  }, col.title), col.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href || '#',
    style: {
      fontSize: 'var(--body-sm-size)',
      color: 'var(--pm-sky)',
      textDecoration: 'none'
    }
  }, l.label)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: 'var(--space-7) auto 0',
      paddingTop: 'var(--space-4)',
      borderTop: '1px solid rgba(150,212,199,.28)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      justifyContent: 'space-between',
      fontSize: 'var(--body-sm-size)',
      color: 'var(--pm-blush)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "A Glowing Cheetah Studios game. Miami, FL."), /*#__PURE__*/React.createElement("span", null, "hello@glowingcheetah.com"), /*#__PURE__*/React.createElement("span", null, "\xA9 ", new Date().getFullYear(), " Glowing Cheetah Studios LLC")));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Marketing site nav. Ink bar, mint keyline underneath, one primary action. */
function NavBar({
  items = [],
  active,
  onNavigate,
  cta = 'Buy on Steam',
  ctaHref,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({}, rest, {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      padding: 'var(--space-4) var(--space-6)',
      background: 'var(--pm-ink)',
      borderBottom: '4px solid var(--pm-mint)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "#top",
    onClick: e => {
      e.preventDefault();
      onNavigate && onNavigate(items[0]);
    },
    style: {
      display: 'flex',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    width: 150
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)'
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    href: `#${it.toLowerCase().replace(/\s+/g, '-')}`,
    onClick: e => {
      e.preventDefault();
      onNavigate && onNavigate(it);
    },
    style: {
      fontSize: 'var(--body-size)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textDecoration: 'none',
      color: active === it ? 'var(--pm-mint)' : 'var(--pm-sky)',
      borderBottom: active === it ? '3px solid var(--pm-mint)' : '3px solid transparent',
      paddingBottom: 2,
      transition: 'color var(--dur-hover) var(--ease-out)'
    }
  }, it)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    href: ctaHref
  }, cta)));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.NavBar = __ds_scope.NavBar;

})();
