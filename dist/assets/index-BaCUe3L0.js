const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-DToQeORc.js","assets/core-fRrmqtr9.js","assets/index-E18bY3LN.js","assets/index-kB1FvQGH.css","assets/events-AT9mxydx.js","assets/index.es-9rRA-KFr.js","assets/all-wallets-C6-JWMAV.js","assets/arrow-bottom-circle-BaK8shMq.js","assets/app-store-DW542_Ny.js","assets/apple-g7l336QI.js","assets/arrow-bottom-DtWdimZs.js","assets/arrow-left-Bx-aoUv_.js","assets/arrow-right-FVAuTUcD.js","assets/arrow-top-CFe1boIY.js","assets/bank-ChLFYwr_.js","assets/browser-CF3JS-YO.js","assets/card-DQYMVHJk.js","assets/checkmark-CCDz_J5C.js","assets/checkmark-bold-CLpcIGk7.js","assets/chevron-bottom-D-hViAbn.js","assets/chevron-left-CroZTSIB.js","assets/chevron-right-C4lsjRt4.js","assets/chevron-top-DqoRh6oK.js","assets/chrome-store-CGLOyESf.js","assets/clock-BaFIP6yR.js","assets/close-obInRW4F.js","assets/compass-Bmuz17E_.js","assets/coinPlaceholder-sbGTE3NQ.js","assets/copy-BB_oLTWE.js","assets/cursor-BDFy22Av.js","assets/cursor-transparent-C_s-H8Nd.js","assets/desktop-rBUxvHAC.js","assets/disconnect-C3vELDBf.js","assets/discord-CsUF8kPB.js","assets/etherscan-DPH4WmkZ.js","assets/extension-CSQPej9S.js","assets/external-link-JJu4MtUC.js","assets/facebook-DE5Haz-h.js","assets/farcaster-B2LX5vfN.js","assets/filters-BjZzt-Ax.js","assets/github-DF5jYCvi.js","assets/google-BV3n-ZpO.js","assets/help-circle-ByaFoOc-.js","assets/image-UvmFNVYX.js","assets/id-BC4nsTA2.js","assets/info-circle-CSshB9fj.js","assets/lightbulb-T6TmbKPv.js","assets/mail-DDioLKD5.js","assets/mobile-Cb-QmRRj.js","assets/more-Bb48R6Ga.js","assets/network-placeholder-DEEzMZz-.js","assets/nftPlaceholder-DNqWXd6F.js","assets/off-h_o3E3vg.js","assets/play-store-CFoZs5P1.js","assets/plus-CMkX7BW9.js","assets/qr-code-DA6kIxcL.js","assets/recycle-horizontal-BII3NaCW.js","assets/refresh-DgOiy9Ca.js","assets/search-BsoyZhkR.js","assets/send-DsH2M2HZ.js","assets/swapHorizontal-Ck05QGzW.js","assets/swapHorizontalMedium-DMhuFb4D.js","assets/swapHorizontalBold-C8f3eBV2.js","assets/swapHorizontalRoundedBold-tWZbaRKn.js","assets/swapVertical-AaCs5-Du.js","assets/telegram-AO80mufs.js","assets/three-dots-BmV0s5Sz.js","assets/twitch-uwZvEjuS.js","assets/x-DHXGkYpW.js","assets/twitterIcon-BlSskvRl.js","assets/verify-DJzS8WRw.js","assets/verify-filled-CVWipBpC.js","assets/wallet-SJ93k-ub.js","assets/walletconnect-CIm9og9_.js","assets/wallet-placeholder-DB4fZ74W.js","assets/warning-circle-BrGx8Nlt.js","assets/info-Dwv0wXyJ.js","assets/exclamation-triangle-r0Abl2Ij.js","assets/reown-logo-DhmCDIhl.js"])))=>i.map(i=>d[i]);
import { I as notEqual, J as defaultConverter, k as css, l as resetStyles, L as LitElement, m as html, K as nothing, N as noChange, o as colorStyles, n as elementStyles } from './core-fRrmqtr9.js';
import { w as __vitePreload } from './index-E18bY3LN.js';

const UiHelperUtil = {
    getSpacingStyles(spacing, index) {
        if (Array.isArray(spacing)) {
            return spacing[index] ? `var(--wui-spacing-${spacing[index]})` : undefined;
        }
        else if (typeof spacing === 'string') {
            return `var(--wui-spacing-${spacing})`;
        }
        return undefined;
    },
    getFormattedDate(date) {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    },
    getHostName(url) {
        try {
            const newUrl = new URL(url);
            return newUrl.hostname;
        }
        catch (error) {
            return '';
        }
    },
    getTruncateString({ string, charsStart, charsEnd, truncate }) {
        if (string.length <= charsStart + charsEnd) {
            return string;
        }
        if (truncate === 'end') {
            return `${string.substring(0, charsStart)}...`;
        }
        else if (truncate === 'start') {
            return `...${string.substring(string.length - charsEnd)}`;
        }
        return `${string.substring(0, Math.floor(charsStart))}...${string.substring(string.length - Math.floor(charsEnd))}`;
    },
    generateAvatarColors(address) {
        const hash = address
            .toLowerCase()
            .replace(/^0x/iu, '')
            .replace(/[^a-f0-9]/gu, '');
        const baseColor = hash.substring(0, 6).padEnd(6, '0');
        const rgbColor = this.hexToRgb(baseColor);
        const masterBorderRadius = getComputedStyle(document.documentElement).getPropertyValue('--w3m-border-radius-master');
        const radius = Number(masterBorderRadius?.replace('px', ''));
        const edge = 100 - 3 * radius;
        const gradientCircle = `${edge}% ${edge}% at 65% 40%`;
        const colors = [];
        for (let i = 0; i < 5; i += 1) {
            const tintedColor = this.tintColor(rgbColor, 0.15 * i);
            colors.push(`rgb(${tintedColor[0]}, ${tintedColor[1]}, ${tintedColor[2]})`);
        }
        return `
    --local-color-1: ${colors[0]};
    --local-color-2: ${colors[1]};
    --local-color-3: ${colors[2]};
    --local-color-4: ${colors[3]};
    --local-color-5: ${colors[4]};
    --local-radial-circle: ${gradientCircle}
   `;
    },
    hexToRgb(hex) {
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    },
    tintColor(rgb, tint) {
        const [r, g, b] = rgb;
        const tintedR = Math.round(r + (255 - r) * tint);
        const tintedG = Math.round(g + (255 - g) * tint);
        const tintedB = Math.round(b + (255 - b) * tint);
        return [tintedR, tintedG, tintedB];
    },
    isNumber(character) {
        const regex = {
            number: /^[0-9]+$/u
        };
        return regex.number.test(character);
    },
    getColorTheme(theme) {
        if (theme) {
            return theme;
        }
        else if (typeof window !== 'undefined' && window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)')?.matches) {
                return 'dark';
            }
            return 'light';
        }
        return 'dark';
    },
    splitBalance(input) {
        const parts = input.split('.');
        if (parts.length === 2) {
            return [parts[0], parts[1]];
        }
        return ['0', '00'];
    },
    roundNumber(number, threshold, fixed) {
        const roundedNumber = number.toString().length >= threshold ? Number(number).toFixed(fixed) : number;
        return roundedNumber;
    },
    formatNumberToLocalString(value, decimals = 2) {
        if (value === undefined) {
            return '0.00';
        }
        if (typeof value === 'number') {
            return value.toLocaleString('en-US', {
                maximumFractionDigits: decimals,
                minimumFractionDigits: decimals
            });
        }
        return parseFloat(value).toLocaleString('en-US', {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        });
    }
};

function standardCustomElement(tagName, descriptor) {
    const { kind, elements } = descriptor;
    return {
        kind,
        elements,
        finisher(clazz) {
            if (!customElements.get(tagName)) {
                customElements.define(tagName, clazz);
            }
        }
    };
}
function legacyCustomElement(tagName, clazz) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, clazz);
    }
    return clazz;
}
function customElement(tagName) {
    return function create(classOrDescriptor) {
        return typeof classOrDescriptor === 'function'
            ? legacyCustomElement(tagName, classOrDescriptor)
            : standardCustomElement(tagName, classOrDescriptor);
    };
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let issueWarning;
{
  globalThis.litIssuedWarnings ??= /* @__PURE__ */ new Set();
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!globalThis.litIssuedWarnings.has(warning) && !globalThis.litIssuedWarnings.has(code)) {
      console.warn(warning);
      globalThis.litIssuedWarnings.add(warning);
    }
  };
}
const legacyProperty = (options, proto, name) => {
  const hasOwnProperty = proto.hasOwnProperty(name);
  proto.constructor.createProperty(name, options);
  return hasOwnProperty ? Object.getOwnPropertyDescriptor(proto, name) : void 0;
};
const defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
const standardProperty = (options = defaultPropertyDeclaration, target, context) => {
  const { kind, metadata } = context;
  if (metadata == null) {
    issueWarning("missing-class-metadata", `The class ${target} is missing decorator metadata. This could mean that you're using a compiler that supports decorators but doesn't support decorator metadata, such as TypeScript 5.1. Please update your compiler.`);
  }
  let properties = globalThis.litPropertyMetadata.get(metadata);
  if (properties === void 0) {
    globalThis.litPropertyMetadata.set(metadata, properties = /* @__PURE__ */ new Map());
  }
  if (kind === "setter") {
    options = Object.create(options);
    options.wrapped = true;
  }
  properties.set(context.name, options);
  if (kind === "accessor") {
    const { name } = context;
    return {
      set(v) {
        const oldValue = target.get.call(this);
        target.set.call(this, v);
        this.requestUpdate(name, oldValue, options);
      },
      init(v) {
        if (v !== void 0) {
          this._$changeProperty(name, void 0, options, v);
        }
        return v;
      }
    };
  } else if (kind === "setter") {
    const { name } = context;
    return function(value) {
      const oldValue = this[name];
      target.call(this, value);
      this.requestUpdate(name, oldValue, options);
    };
  }
  throw new Error(`Unsupported decorator location: ${kind}`);
};
function property(options) {
  return (protoOrTarget, nameOrContext) => {
    return typeof nameOrContext === "object" ? standardProperty(options, protoOrTarget, nameOrContext) : legacyProperty(options, protoOrTarget, nameOrContext);
  };
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */
/**
 * Declares a private or protected reactive property that still triggers
 * updates to the element when it changes. It does not reflect from the
 * corresponding attribute.
 *
 * Properties declared this way must not be used from HTML or HTML templating
 * systems, they're solely for properties internal to the element. These
 * properties may be renamed by optimization tools like closure compiler.
 * @category Decorator
 */
function state(options) {
    return property({
        ...options,
        // Add both `state` and `attribute` because we found a third party
        // controller that is keying off of PropertyOptions.state to determine
        // whether a field is a private internal property or not.
        state: true,
        attribute: false,
    });
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
{
  globalThis.litIssuedWarnings ??= /* @__PURE__ */ new Set();
}

const styles$6 = css `
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;

var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiFlex = class WuiFlex extends LitElement {
    render() {
        this.style.cssText = `
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap && `var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap && `var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap && `var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding && UiHelperUtil.getSpacingStyles(this.padding, 0)};
      padding-right: ${this.padding && UiHelperUtil.getSpacingStyles(this.padding, 1)};
      padding-bottom: ${this.padding && UiHelperUtil.getSpacingStyles(this.padding, 2)};
      padding-left: ${this.padding && UiHelperUtil.getSpacingStyles(this.padding, 3)};
      margin-top: ${this.margin && UiHelperUtil.getSpacingStyles(this.margin, 0)};
      margin-right: ${this.margin && UiHelperUtil.getSpacingStyles(this.margin, 1)};
      margin-bottom: ${this.margin && UiHelperUtil.getSpacingStyles(this.margin, 2)};
      margin-left: ${this.margin && UiHelperUtil.getSpacingStyles(this.margin, 3)};
    `;
        return html `<slot></slot>`;
    }
};
WuiFlex.styles = [resetStyles, styles$6];
__decorate$6([
    property()
], WuiFlex.prototype, "flexDirection", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "flexWrap", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "flexBasis", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "flexGrow", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "flexShrink", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "alignItems", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "justifyContent", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "columnGap", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "rowGap", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "gap", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "padding", void 0);
__decorate$6([
    property()
], WuiFlex.prototype, "margin", void 0);
WuiFlex = __decorate$6([
    customElement('wui-flex')
], WuiFlex);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
const ifDefined = (value) => value ?? nothing;

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
window.ShadyDOM?.inUse &&
    window.ShadyDOM?.noPatch === true
    ? window.ShadyDOM.wrap
    : (node) => node;
/**
 * Tests if a value is a primitive value.
 *
 * See https://tc39.github.io/ecma262/#sec-typeof-operator
 */
const isPrimitive = (value) => value === null || (typeof value != 'object' && typeof value != 'function');
/**
 * Tests whether a part has only a single-expression with no strings to
 * interpolate between.
 *
 * Only AttributePart and PropertyPart can have multiple expressions.
 * Multi-expression parts have a `strings` property and single-expression
 * parts do not.
 */
const isSingleExpression = (part) => part.strings === undefined;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const PartType = {
    ATTRIBUTE: 1,
    CHILD: 2};
/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
const directive = (c) => (...values) => ({
    // This property needs to remain unminified.
    ['_$litDirective$']: c,
    values,
});
/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
class Directive {
    constructor(_partInfo) { }
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    /** @internal */
    _$initialize(part, parent, attributeIndex) {
        this.__part = part;
        this._$parent = parent;
        this.__attributeIndex = attributeIndex;
    }
    /** @internal */
    _$resolve(part, props) {
        return this.update(part, props);
    }
    update(_part, props) {
        return this.render(...props);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Recursively walks down the tree of Parts/TemplateInstances/Directives to set
 * the connected state of directives and run `disconnected`/ `reconnected`
 * callbacks.
 *
 * @return True if there were children to disconnect; false otherwise
 */
const notifyChildrenConnectedChanged = (parent, isConnected) => {
    const children = parent._$disconnectableChildren;
    if (children === undefined) {
        return false;
    }
    for (const obj of children) {
        // The existence of `_$notifyDirectiveConnectionChanged` is used as a "brand" to
        // disambiguate AsyncDirectives from other DisconnectableChildren
        // (as opposed to using an instanceof check to know when to call it); the
        // redundancy of "Directive" in the API name is to avoid conflicting with
        // `_$notifyConnectionChanged`, which exists `ChildParts` which are also in
        // this list
        // Disconnect Directive (and any nested directives contained within)
        // This property needs to remain unminified.
        obj['_$notifyDirectiveConnectionChanged']?.(isConnected, false);
        // Disconnect Part/TemplateInstance
        notifyChildrenConnectedChanged(obj, isConnected);
    }
    return true;
};
/**
 * Removes the given child from its parent list of disconnectable children, and
 * if the parent list becomes empty as a result, removes the parent from its
 * parent, and so forth up the tree when that causes subsequent parent lists to
 * become empty.
 */
const removeDisconnectableFromParent = (obj) => {
    let parent, children;
    do {
        if ((parent = obj._$parent) === undefined) {
            break;
        }
        children = parent._$disconnectableChildren;
        children.delete(obj);
        obj = parent;
    } while (children?.size === 0);
};
const addDisconnectableToParent = (obj) => {
    // Climb the parent tree, creating a sparse tree of children needing
    // disconnection
    for (let parent; (parent = obj._$parent); obj = parent) {
        let children = parent._$disconnectableChildren;
        if (children === undefined) {
            parent._$disconnectableChildren = children = new Set();
        }
        else if (children.has(obj)) {
            // Once we've reached a parent that already contains this child, we
            // can short-circuit
            break;
        }
        children.add(obj);
        installDisconnectAPI(parent);
    }
};
/**
 * Changes the parent reference of the ChildPart, and updates the sparse tree of
 * Disconnectable children accordingly.
 *
 * Note, this method will be patched onto ChildPart instances and called from
 * the core code when parts are moved between different parents.
 */
function reparentDisconnectables(newParent) {
    if (this._$disconnectableChildren !== undefined) {
        removeDisconnectableFromParent(this);
        this._$parent = newParent;
        addDisconnectableToParent(this);
    }
    else {
        this._$parent = newParent;
    }
}
/**
 * Sets the connected state on any directives contained within the committed
 * value of this part (i.e. within a TemplateInstance or iterable of
 * ChildParts) and runs their `disconnected`/`reconnected`s, as well as within
 * any directives stored on the ChildPart (when `valueOnly` is false).
 *
 * `isClearingValue` should be passed as `true` on a top-level part that is
 * clearing itself, and not as a result of recursively disconnecting directives
 * as part of a `clear` operation higher up the tree. This both ensures that any
 * directive on this ChildPart that produced a value that caused the clear
 * operation is not disconnected, and also serves as a performance optimization
 * to avoid needless bookkeeping when a subtree is going away; when clearing a
 * subtree, only the top-most part need to remove itself from the parent.
 *
 * `fromPartIndex` is passed only in the case of a partial `_clear` running as a
 * result of truncating an iterable.
 *
 * Note, this method will be patched onto ChildPart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function notifyChildPartConnectedChanged(isConnected, isClearingValue = false, fromPartIndex = 0) {
    const value = this._$committedValue;
    const children = this._$disconnectableChildren;
    if (children === undefined || children.size === 0) {
        return;
    }
    if (isClearingValue) {
        if (Array.isArray(value)) {
            // Iterable case: Any ChildParts created by the iterable should be
            // disconnected and removed from this ChildPart's disconnectable
            // children (starting at `fromPartIndex` in the case of truncation)
            for (let i = fromPartIndex; i < value.length; i++) {
                notifyChildrenConnectedChanged(value[i], false);
                removeDisconnectableFromParent(value[i]);
            }
        }
        else if (value != null) {
            // TemplateInstance case: If the value has disconnectable children (will
            // only be in the case that it is a TemplateInstance), we disconnect it
            // and remove it from this ChildPart's disconnectable children
            notifyChildrenConnectedChanged(value, false);
            removeDisconnectableFromParent(value);
        }
    }
    else {
        notifyChildrenConnectedChanged(this, isConnected);
    }
}
/**
 * Patches disconnection API onto ChildParts.
 */
const installDisconnectAPI = (obj) => {
    if (obj.type == PartType.CHILD) {
        obj._$notifyConnectionChanged ??=
            notifyChildPartConnectedChanged;
        obj._$reparentDisconnectables ??= reparentDisconnectables;
    }
};
/**
 * An abstract `Directive` base class whose `disconnected` method will be
 * called when the part containing the directive is cleared as a result of
 * re-rendering, or when the user calls `part.setConnected(false)` on
 * a part that was previously rendered containing the directive (as happens
 * when e.g. a LitElement disconnects from the DOM).
 *
 * If `part.setConnected(true)` is subsequently called on a
 * containing part, the directive's `reconnected` method will be called prior
 * to its next `update`/`render` callbacks. When implementing `disconnected`,
 * `reconnected` should also be implemented to be compatible with reconnection.
 *
 * Note that updates may occur while the directive is disconnected. As such,
 * directives should generally check the `this.isConnected` flag during
 * render/update to determine whether it is safe to subscribe to resources
 * that may prevent garbage collection.
 */
class AsyncDirective extends Directive {
    constructor() {
        super(...arguments);
        // @internal
        this._$disconnectableChildren = undefined;
    }
    /**
     * Initialize the part with internal fields
     * @param part
     * @param parent
     * @param attributeIndex
     */
    _$initialize(part, parent, attributeIndex) {
        super._$initialize(part, parent, attributeIndex);
        addDisconnectableToParent(this);
        this.isConnected = part._$isConnected;
    }
    // This property needs to remain unminified.
    /**
     * Called from the core code when a directive is going away from a part (in
     * which case `shouldRemoveFromParent` should be true), and from the
     * `setChildrenConnected` helper function when recursively changing the
     * connection state of a tree (in which case `shouldRemoveFromParent` should
     * be false).
     *
     * @param isConnected
     * @param isClearingDirective - True when the directive itself is being
     *     removed; false when the tree is being disconnected
     * @internal
     */
    ['_$notifyDirectiveConnectionChanged'](isConnected, isClearingDirective = true) {
        if (isConnected !== this.isConnected) {
            this.isConnected = isConnected;
            if (isConnected) {
                this.reconnected?.();
            }
            else {
                this.disconnected?.();
            }
        }
        if (isClearingDirective) {
            notifyChildrenConnectedChanged(this, isConnected);
            removeDisconnectableFromParent(this);
        }
    }
    /**
     * Sets the value of the directive's Part outside the normal `update`/`render`
     * lifecycle of a directive.
     *
     * This method should not be called synchronously from a directive's `update`
     * or `render`.
     *
     * @param directive The directive to update
     * @param value The value to set
     */
    setValue(value) {
        if (isSingleExpression(this.__part)) {
            this.__part._$setValue(value, this);
        }
        else {
            // this.__attributeIndex will be defined in this case, but
            // assert it in dev mode
            if (this.__attributeIndex === undefined) {
                throw new Error(`Expected this.__attributeIndex to be a number`);
            }
            const newValues = [...this.__part._$committedValue];
            newValues[this.__attributeIndex] = value;
            this.__part._$setValue(newValues, this, 0);
        }
    }
    /**
     * User callbacks for implementing logic to release any resources/subscriptions
     * that may have been retained by this directive. Since directives may also be
     * re-connected, `reconnected` should also be implemented to restore the
     * working state of the directive prior to the next render.
     */
    disconnected() { }
    reconnected() { }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// Note, this module is not included in package exports so that it's private to
// our first-party directives. If it ends up being useful, we can open it up and
// export it.
/**
 * Helper to iterate an AsyncIterable in its own closure.
 * @param iterable The iterable to iterate
 * @param callback The callback to call for each value. If the callback returns
 * `false`, the loop will be broken.
 */
/**
 * Holds a reference to an instance that can be disconnected and reconnected,
 * so that a closure over the ref (e.g. in a then function to a promise) does
 * not strongly hold a ref to the instance. Approximates a WeakRef but must
 * be manually connected & disconnected to the backing instance.
 */
class PseudoWeakRef {
    constructor(ref) {
        this._ref = ref;
    }
    /**
     * Disassociates the ref with the backing instance.
     */
    disconnect() {
        this._ref = undefined;
    }
    /**
     * Reassociates the ref with the backing instance.
     */
    reconnect(ref) {
        this._ref = ref;
    }
    /**
     * Retrieves the backing instance (will be undefined when disconnected)
     */
    deref() {
        return this._ref;
    }
}
/**
 * A helper to pause and resume waiting on a condition in an async function
 */
class Pauser {
    constructor() {
        this._promise = undefined;
        this._resolve = undefined;
    }
    /**
     * When paused, returns a promise to be awaited; when unpaused, returns
     * undefined. Note that in the microtask between the pauser being resumed
     * an await of this promise resolving, the pauser could be paused again,
     * hence callers should check the promise in a loop when awaiting.
     * @returns A promise to be awaited when paused or undefined
     */
    get() {
        return this._promise;
    }
    /**
     * Creates a promise to be awaited
     */
    pause() {
        this._promise ??= new Promise((resolve) => (this._resolve = resolve));
    }
    /**
     * Resolves the promise which may be awaited
     */
    resume() {
        this._resolve?.();
        this._promise = this._resolve = undefined;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const isPromise = (x) => {
    return !isPrimitive(x) && typeof x.then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x3fffffff;
class UntilDirective extends AsyncDirective {
    constructor() {
        super(...arguments);
        this.__lastRenderedIndex = _infinity;
        this.__values = [];
        this.__weakThis = new PseudoWeakRef(this);
        this.__pauser = new Pauser();
    }
    render(...args) {
        return args.find((x) => !isPromise(x)) ?? noChange;
    }
    update(_part, args) {
        const previousValues = this.__values;
        let previousLength = previousValues.length;
        this.__values = args;
        const weakThis = this.__weakThis;
        const pauser = this.__pauser;
        // If our initial render occurs while disconnected, ensure that the pauser
        // and weakThis are in the disconnected state
        if (!this.isConnected) {
            this.disconnected();
        }
        for (let i = 0; i < args.length; i++) {
            // If we've rendered a higher-priority value already, stop.
            if (i > this.__lastRenderedIndex) {
                break;
            }
            const value = args[i];
            // Render non-Promise values immediately
            if (!isPromise(value)) {
                this.__lastRenderedIndex = i;
                // Since a lower-priority value will never overwrite a higher-priority
                // synchronous value, we can stop processing now.
                return value;
            }
            // If this is a Promise we've already handled, skip it.
            if (i < previousLength && value === previousValues[i]) {
                continue;
            }
            // We have a Promise that we haven't seen before, so priorities may have
            // changed. Forget what we rendered before.
            this.__lastRenderedIndex = _infinity;
            previousLength = 0;
            // Note, the callback avoids closing over `this` so that the directive
            // can be gc'ed before the promise resolves; instead `this` is retrieved
            // from `weakThis`, which can break the hard reference in the closure when
            // the directive disconnects
            Promise.resolve(value).then(async (result) => {
                // If we're disconnected, wait until we're (maybe) reconnected
                // The while loop here handles the case that the connection state
                // thrashes, causing the pauser to resume and then get re-paused
                while (pauser.get()) {
                    await pauser.get();
                }
                // If the callback gets here and there is no `this`, it means that the
                // directive has been disconnected and garbage collected and we don't
                // need to do anything else
                const _this = weakThis.deref();
                if (_this !== undefined) {
                    const index = _this.__values.indexOf(value);
                    // If state.values doesn't contain the value, we've re-rendered without
                    // the value, so don't render it. Then, only render if the value is
                    // higher-priority than what's already been rendered.
                    if (index > -1 && index < _this.__lastRenderedIndex) {
                        _this.__lastRenderedIndex = index;
                        _this.setValue(result);
                    }
                }
            });
        }
        return noChange;
    }
    disconnected() {
        this.__weakThis.disconnect();
        this.__pauser.pause();
    }
    reconnected() {
        this.__weakThis.reconnect(this);
        this.__pauser.resume();
    }
}
/**
 * Renders one of a series of values, including Promises, to a Part.
 *
 * Values are rendered in priority order, with the first argument having the
 * highest priority and the last argument having the lowest priority. If a
 * value is a Promise, low-priority values will be rendered until it resolves.
 *
 * The priority of values can be used to create placeholder content for async
 * data. For example, a Promise with pending content can be the first,
 * highest-priority, argument, and a non_promise loading indicator template can
 * be used as the second, lower-priority, argument. The loading indicator will
 * render immediately, and the primary content will render when the Promise
 * resolves.
 *
 * Example:
 *
 * ```js
 * const content = fetch('./content.txt').then(r => r.text());
 * html`${until(content, html`<span>Loading...</span>`)}`
 * ```
 */
const until = directive(UntilDirective);
/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
// export type {UntilDirective};

class CacheUtil {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  set(key, value) {
    this.cache.set(key, value);
  }
  get(key) {
    return this.cache.get(key);
  }
  has(key) {
    return this.cache.has(key);
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
}
const globalSvgCache = new CacheUtil();

const styles$5 = css `
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`;

var __decorate$5 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const ICONS = {
  add: async () => (await __vitePreload(async () => { const {addSvg} = await import('./add-DToQeORc.js');return { addSvg }},true?__vite__mapDeps([0,1,2,3,4,5]):void 0)).addSvg,
  allWallets: async () => (await __vitePreload(async () => { const {allWalletsSvg} = await import('./all-wallets-C6-JWMAV.js');return { allWalletsSvg }},true?__vite__mapDeps([6,1,2,3,4,5]):void 0)).allWalletsSvg,
  arrowBottomCircle: async () => (await __vitePreload(async () => { const {arrowBottomCircleSvg} = await import('./arrow-bottom-circle-BaK8shMq.js');return { arrowBottomCircleSvg }},true?__vite__mapDeps([7,1,2,3,4,5]):void 0)).arrowBottomCircleSvg,
  appStore: async () => (await __vitePreload(async () => { const {appStoreSvg} = await import('./app-store-DW542_Ny.js');return { appStoreSvg }},true?__vite__mapDeps([8,1,2,3,4,5]):void 0)).appStoreSvg,
  apple: async () => (await __vitePreload(async () => { const {appleSvg} = await import('./apple-g7l336QI.js');return { appleSvg }},true?__vite__mapDeps([9,1,2,3,4,5]):void 0)).appleSvg,
  arrowBottom: async () => (await __vitePreload(async () => { const {arrowBottomSvg} = await import('./arrow-bottom-DtWdimZs.js');return { arrowBottomSvg }},true?__vite__mapDeps([10,1,2,3,4,5]):void 0)).arrowBottomSvg,
  arrowLeft: async () => (await __vitePreload(async () => { const {arrowLeftSvg} = await import('./arrow-left-Bx-aoUv_.js');return { arrowLeftSvg }},true?__vite__mapDeps([11,1,2,3,4,5]):void 0)).arrowLeftSvg,
  arrowRight: async () => (await __vitePreload(async () => { const {arrowRightSvg} = await import('./arrow-right-FVAuTUcD.js');return { arrowRightSvg }},true?__vite__mapDeps([12,1,2,3,4,5]):void 0)).arrowRightSvg,
  arrowTop: async () => (await __vitePreload(async () => { const {arrowTopSvg} = await import('./arrow-top-CFe1boIY.js');return { arrowTopSvg }},true?__vite__mapDeps([13,1,2,3,4,5]):void 0)).arrowTopSvg,
  bank: async () => (await __vitePreload(async () => { const {bankSvg} = await import('./bank-ChLFYwr_.js');return { bankSvg }},true?__vite__mapDeps([14,1,2,3,4,5]):void 0)).bankSvg,
  browser: async () => (await __vitePreload(async () => { const {browserSvg} = await import('./browser-CF3JS-YO.js');return { browserSvg }},true?__vite__mapDeps([15,1,2,3,4,5]):void 0)).browserSvg,
  card: async () => (await __vitePreload(async () => { const {cardSvg} = await import('./card-DQYMVHJk.js');return { cardSvg }},true?__vite__mapDeps([16,1,2,3,4,5]):void 0)).cardSvg,
  checkmark: async () => (await __vitePreload(async () => { const {checkmarkSvg} = await import('./checkmark-CCDz_J5C.js');return { checkmarkSvg }},true?__vite__mapDeps([17,1,2,3,4,5]):void 0)).checkmarkSvg,
  checkmarkBold: async () => (await __vitePreload(async () => { const {checkmarkBoldSvg} = await import('./checkmark-bold-CLpcIGk7.js');return { checkmarkBoldSvg }},true?__vite__mapDeps([18,1,2,3,4,5]):void 0)).checkmarkBoldSvg,
  chevronBottom: async () => (await __vitePreload(async () => { const {chevronBottomSvg} = await import('./chevron-bottom-D-hViAbn.js');return { chevronBottomSvg }},true?__vite__mapDeps([19,1,2,3,4,5]):void 0)).chevronBottomSvg,
  chevronLeft: async () => (await __vitePreload(async () => { const {chevronLeftSvg} = await import('./chevron-left-CroZTSIB.js');return { chevronLeftSvg }},true?__vite__mapDeps([20,1,2,3,4,5]):void 0)).chevronLeftSvg,
  chevronRight: async () => (await __vitePreload(async () => { const {chevronRightSvg} = await import('./chevron-right-C4lsjRt4.js');return { chevronRightSvg }},true?__vite__mapDeps([21,1,2,3,4,5]):void 0)).chevronRightSvg,
  chevronTop: async () => (await __vitePreload(async () => { const {chevronTopSvg} = await import('./chevron-top-DqoRh6oK.js');return { chevronTopSvg }},true?__vite__mapDeps([22,1,2,3,4,5]):void 0)).chevronTopSvg,
  chromeStore: async () => (await __vitePreload(async () => { const {chromeStoreSvg} = await import('./chrome-store-CGLOyESf.js');return { chromeStoreSvg }},true?__vite__mapDeps([23,1,2,3,4,5]):void 0)).chromeStoreSvg,
  clock: async () => (await __vitePreload(async () => { const {clockSvg} = await import('./clock-BaFIP6yR.js');return { clockSvg }},true?__vite__mapDeps([24,1,2,3,4,5]):void 0)).clockSvg,
  close: async () => (await __vitePreload(async () => { const {closeSvg} = await import('./close-obInRW4F.js');return { closeSvg }},true?__vite__mapDeps([25,1,2,3,4,5]):void 0)).closeSvg,
  compass: async () => (await __vitePreload(async () => { const {compassSvg} = await import('./compass-Bmuz17E_.js');return { compassSvg }},true?__vite__mapDeps([26,1,2,3,4,5]):void 0)).compassSvg,
  coinPlaceholder: async () => (await __vitePreload(async () => { const {coinPlaceholderSvg} = await import('./coinPlaceholder-sbGTE3NQ.js');return { coinPlaceholderSvg }},true?__vite__mapDeps([27,1,2,3,4,5]):void 0)).coinPlaceholderSvg,
  copy: async () => (await __vitePreload(async () => { const {copySvg} = await import('./copy-BB_oLTWE.js');return { copySvg }},true?__vite__mapDeps([28,1,2,3,4,5]):void 0)).copySvg,
  cursor: async () => (await __vitePreload(async () => { const {cursorSvg} = await import('./cursor-BDFy22Av.js');return { cursorSvg }},true?__vite__mapDeps([29,1,2,3,4,5]):void 0)).cursorSvg,
  cursorTransparent: async () => (await __vitePreload(async () => { const {cursorTransparentSvg} = await import('./cursor-transparent-C_s-H8Nd.js');return { cursorTransparentSvg }},true?__vite__mapDeps([30,1,2,3,4,5]):void 0)).cursorTransparentSvg,
  desktop: async () => (await __vitePreload(async () => { const {desktopSvg} = await import('./desktop-rBUxvHAC.js');return { desktopSvg }},true?__vite__mapDeps([31,1,2,3,4,5]):void 0)).desktopSvg,
  disconnect: async () => (await __vitePreload(async () => { const {disconnectSvg} = await import('./disconnect-C3vELDBf.js');return { disconnectSvg }},true?__vite__mapDeps([32,1,2,3,4,5]):void 0)).disconnectSvg,
  discord: async () => (await __vitePreload(async () => { const {discordSvg} = await import('./discord-CsUF8kPB.js');return { discordSvg }},true?__vite__mapDeps([33,1,2,3,4,5]):void 0)).discordSvg,
  etherscan: async () => (await __vitePreload(async () => { const {etherscanSvg} = await import('./etherscan-DPH4WmkZ.js');return { etherscanSvg }},true?__vite__mapDeps([34,1,2,3,4,5]):void 0)).etherscanSvg,
  extension: async () => (await __vitePreload(async () => { const {extensionSvg} = await import('./extension-CSQPej9S.js');return { extensionSvg }},true?__vite__mapDeps([35,1,2,3,4,5]):void 0)).extensionSvg,
  externalLink: async () => (await __vitePreload(async () => { const {externalLinkSvg} = await import('./external-link-JJu4MtUC.js');return { externalLinkSvg }},true?__vite__mapDeps([36,1,2,3,4,5]):void 0)).externalLinkSvg,
  facebook: async () => (await __vitePreload(async () => { const {facebookSvg} = await import('./facebook-DE5Haz-h.js');return { facebookSvg }},true?__vite__mapDeps([37,1,2,3,4,5]):void 0)).facebookSvg,
  farcaster: async () => (await __vitePreload(async () => { const {farcasterSvg} = await import('./farcaster-B2LX5vfN.js');return { farcasterSvg }},true?__vite__mapDeps([38,1,2,3,4,5]):void 0)).farcasterSvg,
  filters: async () => (await __vitePreload(async () => { const {filtersSvg} = await import('./filters-BjZzt-Ax.js');return { filtersSvg }},true?__vite__mapDeps([39,1,2,3,4,5]):void 0)).filtersSvg,
  github: async () => (await __vitePreload(async () => { const {githubSvg} = await import('./github-DF5jYCvi.js');return { githubSvg }},true?__vite__mapDeps([40,1,2,3,4,5]):void 0)).githubSvg,
  google: async () => (await __vitePreload(async () => { const {googleSvg} = await import('./google-BV3n-ZpO.js');return { googleSvg }},true?__vite__mapDeps([41,1,2,3,4,5]):void 0)).googleSvg,
  helpCircle: async () => (await __vitePreload(async () => { const {helpCircleSvg} = await import('./help-circle-ByaFoOc-.js');return { helpCircleSvg }},true?__vite__mapDeps([42,1,2,3,4,5]):void 0)).helpCircleSvg,
  image: async () => (await __vitePreload(async () => { const {imageSvg} = await import('./image-UvmFNVYX.js');return { imageSvg }},true?__vite__mapDeps([43,1,2,3,4,5]):void 0)).imageSvg,
  id: async () => (await __vitePreload(async () => { const {idSvg} = await import('./id-BC4nsTA2.js');return { idSvg }},true?__vite__mapDeps([44,1,2,3,4,5]):void 0)).idSvg,
  infoCircle: async () => (await __vitePreload(async () => { const {infoCircleSvg} = await import('./info-circle-CSshB9fj.js');return { infoCircleSvg }},true?__vite__mapDeps([45,1,2,3,4,5]):void 0)).infoCircleSvg,
  lightbulb: async () => (await __vitePreload(async () => { const {lightbulbSvg} = await import('./lightbulb-T6TmbKPv.js');return { lightbulbSvg }},true?__vite__mapDeps([46,1,2,3,4,5]):void 0)).lightbulbSvg,
  mail: async () => (await __vitePreload(async () => { const {mailSvg} = await import('./mail-DDioLKD5.js');return { mailSvg }},true?__vite__mapDeps([47,1,2,3,4,5]):void 0)).mailSvg,
  mobile: async () => (await __vitePreload(async () => { const {mobileSvg} = await import('./mobile-Cb-QmRRj.js');return { mobileSvg }},true?__vite__mapDeps([48,1,2,3,4,5]):void 0)).mobileSvg,
  more: async () => (await __vitePreload(async () => { const {moreSvg} = await import('./more-Bb48R6Ga.js');return { moreSvg }},true?__vite__mapDeps([49,1,2,3,4,5]):void 0)).moreSvg,
  networkPlaceholder: async () => (await __vitePreload(async () => { const {networkPlaceholderSvg} = await import('./network-placeholder-DEEzMZz-.js');return { networkPlaceholderSvg }},true?__vite__mapDeps([50,1,2,3,4,5]):void 0)).networkPlaceholderSvg,
  nftPlaceholder: async () => (await __vitePreload(async () => { const {nftPlaceholderSvg} = await import('./nftPlaceholder-DNqWXd6F.js');return { nftPlaceholderSvg }},true?__vite__mapDeps([51,1,2,3,4,5]):void 0)).nftPlaceholderSvg,
  off: async () => (await __vitePreload(async () => { const {offSvg} = await import('./off-h_o3E3vg.js');return { offSvg }},true?__vite__mapDeps([52,1,2,3,4,5]):void 0)).offSvg,
  playStore: async () => (await __vitePreload(async () => { const {playStoreSvg} = await import('./play-store-CFoZs5P1.js');return { playStoreSvg }},true?__vite__mapDeps([53,1,2,3,4,5]):void 0)).playStoreSvg,
  plus: async () => (await __vitePreload(async () => { const {plusSvg} = await import('./plus-CMkX7BW9.js');return { plusSvg }},true?__vite__mapDeps([54,1,2,3,4,5]):void 0)).plusSvg,
  qrCode: async () => (await __vitePreload(async () => { const {qrCodeIcon} = await import('./qr-code-DA6kIxcL.js');return { qrCodeIcon }},true?__vite__mapDeps([55,1,2,3,4,5]):void 0)).qrCodeIcon,
  recycleHorizontal: async () => (await __vitePreload(async () => { const {recycleHorizontalSvg} = await import('./recycle-horizontal-BII3NaCW.js');return { recycleHorizontalSvg }},true?__vite__mapDeps([56,1,2,3,4,5]):void 0)).recycleHorizontalSvg,
  refresh: async () => (await __vitePreload(async () => { const {refreshSvg} = await import('./refresh-DgOiy9Ca.js');return { refreshSvg }},true?__vite__mapDeps([57,1,2,3,4,5]):void 0)).refreshSvg,
  search: async () => (await __vitePreload(async () => { const {searchSvg} = await import('./search-BsoyZhkR.js');return { searchSvg }},true?__vite__mapDeps([58,1,2,3,4,5]):void 0)).searchSvg,
  send: async () => (await __vitePreload(async () => { const {sendSvg} = await import('./send-DsH2M2HZ.js');return { sendSvg }},true?__vite__mapDeps([59,1,2,3,4,5]):void 0)).sendSvg,
  swapHorizontal: async () => (await __vitePreload(async () => { const {swapHorizontalSvg} = await import('./swapHorizontal-Ck05QGzW.js');return { swapHorizontalSvg }},true?__vite__mapDeps([60,1,2,3,4,5]):void 0)).swapHorizontalSvg,
  swapHorizontalMedium: async () => (await __vitePreload(async () => { const {swapHorizontalMediumSvg} = await import('./swapHorizontalMedium-DMhuFb4D.js');return { swapHorizontalMediumSvg }},true?__vite__mapDeps([61,1,2,3,4,5]):void 0)).swapHorizontalMediumSvg,
  swapHorizontalBold: async () => (await __vitePreload(async () => { const {swapHorizontalBoldSvg} = await import('./swapHorizontalBold-C8f3eBV2.js');return { swapHorizontalBoldSvg }},true?__vite__mapDeps([62,1,2,3,4,5]):void 0)).swapHorizontalBoldSvg,
  swapHorizontalRoundedBold: async () => (await __vitePreload(async () => { const {swapHorizontalRoundedBoldSvg} = await import('./swapHorizontalRoundedBold-tWZbaRKn.js');return { swapHorizontalRoundedBoldSvg }},true?__vite__mapDeps([63,1,2,3,4,5]):void 0)).swapHorizontalRoundedBoldSvg,
  swapVertical: async () => (await __vitePreload(async () => { const {swapVerticalSvg} = await import('./swapVertical-AaCs5-Du.js');return { swapVerticalSvg }},true?__vite__mapDeps([64,1,2,3,4,5]):void 0)).swapVerticalSvg,
  telegram: async () => (await __vitePreload(async () => { const {telegramSvg} = await import('./telegram-AO80mufs.js');return { telegramSvg }},true?__vite__mapDeps([65,1,2,3,4,5]):void 0)).telegramSvg,
  threeDots: async () => (await __vitePreload(async () => { const {threeDotsSvg} = await import('./three-dots-BmV0s5Sz.js');return { threeDotsSvg }},true?__vite__mapDeps([66,1,2,3,4,5]):void 0)).threeDotsSvg,
  twitch: async () => (await __vitePreload(async () => { const {twitchSvg} = await import('./twitch-uwZvEjuS.js');return { twitchSvg }},true?__vite__mapDeps([67,1,2,3,4,5]):void 0)).twitchSvg,
  twitter: async () => (await __vitePreload(async () => { const {xSvg} = await import('./x-DHXGkYpW.js');return { xSvg }},true?__vite__mapDeps([68,1,2,3,4,5]):void 0)).xSvg,
  twitterIcon: async () => (await __vitePreload(async () => { const {twitterIconSvg} = await import('./twitterIcon-BlSskvRl.js');return { twitterIconSvg }},true?__vite__mapDeps([69,1,2,3,4,5]):void 0)).twitterIconSvg,
  verify: async () => (await __vitePreload(async () => { const {verifySvg} = await import('./verify-DJzS8WRw.js');return { verifySvg }},true?__vite__mapDeps([70,1,2,3,4,5]):void 0)).verifySvg,
  verifyFilled: async () => (await __vitePreload(async () => { const {verifyFilledSvg} = await import('./verify-filled-CVWipBpC.js');return { verifyFilledSvg }},true?__vite__mapDeps([71,1,2,3,4,5]):void 0)).verifyFilledSvg,
  wallet: async () => (await __vitePreload(async () => { const {walletSvg} = await import('./wallet-SJ93k-ub.js');return { walletSvg }},true?__vite__mapDeps([72,1,2,3,4,5]):void 0)).walletSvg,
  walletConnect: async () => (await __vitePreload(async () => { const {walletConnectSvg} = await import('./walletconnect-CIm9og9_.js');return { walletConnectSvg }},true?__vite__mapDeps([73,1,2,3,4,5]):void 0)).walletConnectSvg,
  walletConnectLightBrown: async () => (await __vitePreload(async () => { const {walletConnectLightBrownSvg} = await import('./walletconnect-CIm9og9_.js');return { walletConnectLightBrownSvg }},true?__vite__mapDeps([73,1,2,3,4,5]):void 0)).walletConnectLightBrownSvg,
  walletConnectBrown: async () => (await __vitePreload(async () => { const {walletConnectBrownSvg} = await import('./walletconnect-CIm9og9_.js');return { walletConnectBrownSvg }},true?__vite__mapDeps([73,1,2,3,4,5]):void 0)).walletConnectBrownSvg,
  walletPlaceholder: async () => (await __vitePreload(async () => { const {walletPlaceholderSvg} = await import('./wallet-placeholder-DB4fZ74W.js');return { walletPlaceholderSvg }},true?__vite__mapDeps([74,1,2,3,4,5]):void 0)).walletPlaceholderSvg,
  warningCircle: async () => (await __vitePreload(async () => { const {warningCircleSvg} = await import('./warning-circle-BrGx8Nlt.js');return { warningCircleSvg }},true?__vite__mapDeps([75,1,2,3,4,5]):void 0)).warningCircleSvg,
  x: async () => (await __vitePreload(async () => { const {xSvg} = await import('./x-DHXGkYpW.js');return { xSvg }},true?__vite__mapDeps([68,1,2,3,4,5]):void 0)).xSvg,
  info: async () => (await __vitePreload(async () => { const {infoSvg} = await import('./info-Dwv0wXyJ.js');return { infoSvg }},true?__vite__mapDeps([76,1,2,3,4,5]):void 0)).infoSvg,
  exclamationTriangle: async () => (await __vitePreload(async () => { const {exclamationTriangleSvg} = await import('./exclamation-triangle-r0Abl2Ij.js');return { exclamationTriangleSvg }},true?__vite__mapDeps([77,1,2,3,4,5]):void 0)).exclamationTriangleSvg,
  reown: async () => (await __vitePreload(async () => { const {reownSvg} = await import('./reown-logo-DhmCDIhl.js');return { reownSvg }},true?__vite__mapDeps([78,1,2,3,4,5]):void 0)).reownSvg
};
async function getSvg(name) {
  if (globalSvgCache.has(name)) {
    return globalSvgCache.get(name);
  }
  const importFn = ICONS[name] ?? ICONS.copy;
  const svgPromise = importFn();
  globalSvgCache.set(name, svgPromise);
  return svgPromise;
}
let WuiIcon = class WuiIcon2 extends LitElement {
  constructor() {
    super(...arguments);
    this.size = "md";
    this.name = "copy";
    this.color = "fg-300";
    this.aspectRatio = "1 / 1";
  }
  render() {
    this.style.cssText = `
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `;
    return html`${until(getSvg(this.name), html`<div class="fallback"></div>`)}`;
  }
};
WuiIcon.styles = [resetStyles, colorStyles, styles$5];
__decorate$5([
  property()
], WuiIcon.prototype, "size", void 0);
__decorate$5([
  property()
], WuiIcon.prototype, "name", void 0);
__decorate$5([
  property()
], WuiIcon.prototype, "color", void 0);
__decorate$5([
  property()
], WuiIcon.prototype, "aspectRatio", void 0);
WuiIcon = __decorate$5([
  customElement("wui-icon")
], WuiIcon);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class ClassMapDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ATTRIBUTE ||
            partInfo.name !== 'class' ||
            partInfo.strings?.length > 2) {
            throw new Error('`classMap()` can only be used in the `class` attribute ' +
                'and must be the only part in the attribute.');
        }
    }
    render(classInfo) {
        // Add spaces to ensure separation from static classes
        return (' ' +
            Object.keys(classInfo)
                .filter((key) => classInfo[key])
                .join(' ') +
            ' ');
    }
    update(part, [classInfo]) {
        // Remember dynamic classes on the first render
        if (this._previousClasses === undefined) {
            this._previousClasses = new Set();
            if (part.strings !== undefined) {
                this._staticClasses = new Set(part.strings
                    .join(' ')
                    .split(/\s/)
                    .filter((s) => s !== ''));
            }
            for (const name in classInfo) {
                if (classInfo[name] && !this._staticClasses?.has(name)) {
                    this._previousClasses.add(name);
                }
            }
            return this.render(classInfo);
        }
        const classList = part.element.classList;
        // Remove old classes that no longer apply
        for (const name of this._previousClasses) {
            if (!(name in classInfo)) {
                classList.remove(name);
                this._previousClasses.delete(name);
            }
        }
        // Add or remove classes based on their classMap value
        for (const name in classInfo) {
            // We explicitly want a loose truthy check of `value` because it seems
            // more convenient that '' and 0 are skipped.
            const value = !!classInfo[name];
            if (value !== this._previousClasses.has(name) &&
                !this._staticClasses?.has(name)) {
                if (value) {
                    classList.add(name);
                    this._previousClasses.add(name);
                }
                else {
                    classList.remove(name);
                    this._previousClasses.delete(name);
                }
            }
        }
        return noChange;
    }
}
/**
 * A directive that applies dynamic CSS classes.
 *
 * This must be used in the `class` attribute and must be the only part used in
 * the attribute. It takes each property in the `classInfo` argument and adds
 * the property name to the element's `classList` if the property value is
 * truthy; if the property value is falsy, the property name is removed from
 * the element's `class`.
 *
 * For example `{foo: bar}` applies the class `foo` if the value of `bar` is
 * truthy.
 *
 * @param classInfo
 */
const classMap = directive(ClassMapDirective);

const styles$4 = css `
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`;

var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiText = class WuiText extends LitElement {
    constructor() {
        super(...arguments);
        this.variant = 'paragraph-500';
        this.color = 'fg-300';
        this.align = 'left';
        this.lineClamp = undefined;
    }
    render() {
        const classes = {
            [`wui-font-${this.variant}`]: true,
            [`wui-color-${this.color}`]: true,
            [`wui-line-clamp-${this.lineClamp}`]: this.lineClamp ? true : false
        };
        this.style.cssText = `
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `;
        return html `<slot class=${classMap(classes)}></slot>`;
    }
};
WuiText.styles = [resetStyles, styles$4];
__decorate$4([
    property()
], WuiText.prototype, "variant", void 0);
__decorate$4([
    property()
], WuiText.prototype, "color", void 0);
__decorate$4([
    property()
], WuiText.prototype, "align", void 0);
__decorate$4([
    property()
], WuiText.prototype, "lineClamp", void 0);
WuiText = __decorate$4([
    customElement('wui-text')
], WuiText);

const styles$3 = css `
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--wui-color-gray-glass-020);
    border-radius: var(--local-border-radius);
    border: var(--local-border);
    box-sizing: content-box;
    width: var(--local-size);
    height: var(--local-size);
    min-height: var(--local-size);
    min-width: var(--local-size);
  }

  @supports (background: color-mix(in srgb, white 50%, black)) {
    :host {
      background-color: color-mix(in srgb, var(--local-bg-value) var(--local-bg-mix), transparent);
    }
  }
`;

var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiIconBox = class WuiIconBox extends LitElement {
    constructor() {
        super(...arguments);
        this.size = 'md';
        this.backgroundColor = 'accent-100';
        this.iconColor = 'accent-100';
        this.background = 'transparent';
        this.border = false;
        this.borderColor = 'wui-color-bg-125';
        this.icon = 'copy';
    }
    render() {
        const iconSize = this.iconSize || this.size;
        const isLg = this.size === 'lg';
        const isXl = this.size === 'xl';
        const bgMix = isLg ? '12%' : '16%';
        const borderRadius = isLg ? 'xxs' : isXl ? 's' : '3xl';
        const isGray = this.background === 'gray';
        const isOpaque = this.background === 'opaque';
        const isColorChange = (this.backgroundColor === 'accent-100' && isOpaque) ||
            (this.backgroundColor === 'success-100' && isOpaque) ||
            (this.backgroundColor === 'error-100' && isOpaque) ||
            (this.backgroundColor === 'inverse-100' && isOpaque);
        let bgValueVariable = `var(--wui-color-${this.backgroundColor})`;
        if (isColorChange) {
            bgValueVariable = `var(--wui-icon-box-bg-${this.backgroundColor})`;
        }
        else if (isGray) {
            bgValueVariable = `var(--wui-color-gray-${this.backgroundColor})`;
        }
        this.style.cssText = `
       --local-bg-value: ${bgValueVariable};
       --local-bg-mix: ${isColorChange || isGray ? `100%` : bgMix};
       --local-border-radius: var(--wui-border-radius-${borderRadius});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor === 'wui-color-bg-125' ? `2px` : `1px`} solid ${this.border ? `var(--${this.borderColor})` : `transparent`}
   `;
        return html ` <wui-icon color=${this.iconColor} size=${iconSize} name=${this.icon}></wui-icon> `;
    }
};
WuiIconBox.styles = [resetStyles, elementStyles, styles$3];
__decorate$3([
    property()
], WuiIconBox.prototype, "size", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "backgroundColor", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "iconColor", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "iconSize", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "background", void 0);
__decorate$3([
    property({ type: Boolean })
], WuiIconBox.prototype, "border", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "borderColor", void 0);
__decorate$3([
    property()
], WuiIconBox.prototype, "icon", void 0);
WuiIconBox = __decorate$3([
    customElement('wui-icon-box')
], WuiIconBox);

const styles$2 = css `
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`;

var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiImage = class WuiImage extends LitElement {
    constructor() {
        super(...arguments);
        this.src = './path/to/image.jpg';
        this.alt = 'Image';
        this.size = undefined;
    }
    render() {
        this.style.cssText = `
      --local-width: ${this.size ? `var(--wui-icon-size-${this.size});` : '100%'};
      --local-height: ${this.size ? `var(--wui-icon-size-${this.size});` : '100%'};
      `;
        return html `<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`;
    }
    handleImageError() {
        this.dispatchEvent(new CustomEvent('onLoadError', { bubbles: true, composed: true }));
    }
};
WuiImage.styles = [resetStyles, colorStyles, styles$2];
__decorate$2([
    property()
], WuiImage.prototype, "src", void 0);
__decorate$2([
    property()
], WuiImage.prototype, "alt", void 0);
__decorate$2([
    property()
], WuiImage.prototype, "size", void 0);
WuiImage = __decorate$2([
    customElement('wui-image')
], WuiImage);

const styles$1 = css `
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--wui-spacing-m);
    padding: 0 var(--wui-spacing-3xs) !important;
    border-radius: var(--wui-border-radius-5xs);
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host > wui-text {
    transform: translateY(5%);
  }

  :host([data-variant='main']) {
    background-color: var(--wui-color-accent-glass-015);
    color: var(--wui-color-accent-100);
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-200);
  }

  :host([data-variant='success']) {
    background-color: var(--wui-icon-box-bg-success-100);
    color: var(--wui-color-success-100);
  }

  :host([data-variant='error']) {
    background-color: var(--wui-icon-box-bg-error-100);
    color: var(--wui-color-error-100);
  }

  :host([data-size='lg']) {
    padding: 11px 5px !important;
  }

  :host([data-size='lg']) > wui-text {
    transform: translateY(2%);
  }
`;

var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiTag = class WuiTag extends LitElement {
    constructor() {
        super(...arguments);
        this.variant = 'main';
        this.size = 'lg';
    }
    render() {
        this.dataset['variant'] = this.variant;
        this.dataset['size'] = this.size;
        const textVariant = this.size === 'md' ? 'mini-700' : 'micro-700';
        return html `
      <wui-text data-variant=${this.variant} variant=${textVariant} color="inherit">
        <slot></slot>
      </wui-text>
    `;
    }
};
WuiTag.styles = [resetStyles, styles$1];
__decorate$1([
    property()
], WuiTag.prototype, "variant", void 0);
__decorate$1([
    property()
], WuiTag.prototype, "size", void 0);
WuiTag = __decorate$1([
    customElement('wui-tag')
], WuiTag);

const styles = css `
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 2s linear infinite;
  }

  circle {
    fill: none;
    stroke: var(--local-color);
    stroke-width: 4px;
    stroke-dasharray: 1, 124;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 124;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 124;
      stroke-dashoffset: -35;
    }

    100% {
      stroke-dashoffset: -125;
    }
  }
`;

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WuiLoadingSpinner = class WuiLoadingSpinner extends LitElement {
    constructor() {
        super(...arguments);
        this.color = 'accent-100';
        this.size = 'lg';
    }
    render() {
        this.style.cssText = `--local-color: ${this.color === 'inherit' ? 'inherit' : `var(--wui-color-${this.color})`}`;
        this.dataset['size'] = this.size;
        return html `<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`;
    }
};
WuiLoadingSpinner.styles = [resetStyles, styles];
__decorate([
    property()
], WuiLoadingSpinner.prototype, "color", void 0);
__decorate([
    property()
], WuiLoadingSpinner.prototype, "size", void 0);
WuiLoadingSpinner = __decorate([
    customElement('wui-loading-spinner')
], WuiLoadingSpinner);

export { AsyncDirective as A, UiHelperUtil as U, classMap as a, customElement as c, directive as d, ifDefined as i, property as p, state as s };
