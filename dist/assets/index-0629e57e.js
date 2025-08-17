import{I as q,J as Y,k as b,l as E,L as T,m as w,K as J,N as A,o as M,n as K}from"./core-085364e8.js";import{_ as a}from"./wagmi-a145a347.js";const v={getSpacingStyles(e,t){if(Array.isArray(e))return e[t]?`var(--wui-spacing-${e[t]})`:void 0;if(typeof e=="string")return`var(--wui-spacing-${e})`},getFormattedDate(e){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(e)},getHostName(e){try{return new URL(e).hostname}catch{return""}},getTruncateString({string:e,charsStart:t,charsEnd:i,truncate:o}){return e.length<=t+i?e:o==="end"?`${e.substring(0,t)}...`:o==="start"?`...${e.substring(e.length-i)}`:`${e.substring(0,Math.floor(t))}...${e.substring(e.length-Math.floor(i))}`},generateAvatarColors(e){const i=e.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),o=this.hexToRgb(i),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),l=100-3*Number(n?.replace("px","")),s=`${l}% ${l}% at 65% 40%`,u=[];for(let p=0;p<5;p+=1){const g=this.tintColor(o,.15*p);u.push(`rgb(${g[0]}, ${g[1]}, ${g[2]})`)}return`
    --local-color-1: ${u[0]};
    --local-color-2: ${u[1]};
    --local-color-3: ${u[2]};
    --local-color-4: ${u[3]};
    --local-color-5: ${u[4]};
    --local-radial-circle: ${s}
   `},hexToRgb(e){const t=parseInt(e,16),i=t>>16&255,o=t>>8&255,n=t&255;return[i,o,n]},tintColor(e,t){const[i,o,n]=e,r=Math.round(i+(255-i)*t),l=Math.round(o+(255-o)*t),s=Math.round(n+(255-n)*t);return[r,l,s]},isNumber(e){return{number:/^[0-9]+$/u}.number.test(e)},getColorTheme(e){return e||(typeof window<"u"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)")?.matches?"dark":"light":"dark")},splitBalance(e){const t=e.split(".");return t.length===2?[t[0],t[1]]:["0","00"]},roundNumber(e,t,i){return e.toString().length>=t?Number(e).toFixed(i):e},formatNumberToLocalString(e,t=2){return e===void 0?"0.00":typeof e=="number"?e.toLocaleString("en-US",{maximumFractionDigits:t,minimumFractionDigits:t}):parseFloat(e).toLocaleString("en-US",{maximumFractionDigits:t,minimumFractionDigits:t})}};function X(e,t){const{kind:i,elements:o}=t;return{kind:i,elements:o,finisher(n){customElements.get(e)||customElements.define(e,n)}}}function Q(e,t){return customElements.get(e)||customElements.define(e,t),t}function S(e){return function(i){return typeof i=="function"?Q(e,i):X(e,i)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let U;globalThis.litIssuedWarnings??=new Set,U=(e,t)=>{t+=` See https://lit.dev/msg/${e} for more information.`,!globalThis.litIssuedWarnings.has(t)&&!globalThis.litIssuedWarnings.has(e)&&(console.warn(t),globalThis.litIssuedWarnings.add(t))};const Z=(e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0},tt={attribute:!0,type:String,converter:q,reflect:!1,hasChanged:Y},et=(e=tt,t,i)=>{const{kind:o,metadata:n}=i;n==null&&U("missing-class-metadata",`The class ${t} is missing decorator metadata. This could mean that you're using a compiler that supports decorators but doesn't support decorator metadata, such as TypeScript 5.1. Please update your compiler.`);let r=globalThis.litPropertyMetadata.get(n);if(r===void 0&&globalThis.litPropertyMetadata.set(n,r=new Map),o==="setter"&&(e=Object.create(e),e.wrapped=!0),r.set(i.name,e),o==="accessor"){const{name:l}=i;return{set(s){const u=t.get.call(this);t.set.call(this,s),this.requestUpdate(l,u,e)},init(s){return s!==void 0&&this._$changeProperty(l,void 0,e,s),s}}}else if(o==="setter"){const{name:l}=i;return function(s){const u=this[l];t.call(this,s),this.requestUpdate(l,u,e)}}throw new Error(`Unsupported decorator location: ${o}`)};function c(e){return(t,i)=>typeof i=="object"?et(e,t,i):Z(e,t,i)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function xt(e){return c({...e,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */globalThis.litIssuedWarnings??=new Set;const it=b`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var _=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let d=class extends T{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&v.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&v.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&v.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&v.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&v.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&v.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&v.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&v.getSpacingStyles(this.margin,3)};
    `,w`<slot></slot>`}};d.styles=[E,it];_([c()],d.prototype,"flexDirection",void 0);_([c()],d.prototype,"flexWrap",void 0);_([c()],d.prototype,"flexBasis",void 0);_([c()],d.prototype,"flexGrow",void 0);_([c()],d.prototype,"flexShrink",void 0);_([c()],d.prototype,"alignItems",void 0);_([c()],d.prototype,"justifyContent",void 0);_([c()],d.prototype,"columnGap",void 0);_([c()],d.prototype,"rowGap",void 0);_([c()],d.prototype,"gap",void 0);_([c()],d.prototype,"padding",void 0);_([c()],d.prototype,"margin",void 0);d=_([S("wui-flex")],d);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Rt=e=>e??J;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */window.ShadyDOM?.inUse&&window.ShadyDOM?.noPatch===!0&&window.ShadyDOM.wrap;const rt=e=>e===null||typeof e!="object"&&typeof e!="function",ot=e=>e.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const F={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},H=e=>(...t)=>({_$litDirective$:e,values:t});class G{constructor(t){}get _$isConnected(){return this._$parent._$isConnected}_$initialize(t,i,o){this.__part=t,this._$parent=i,this.__attributeIndex=o}_$resolve(t,i){return this.update(t,i)}update(t,i){return this.render(...i)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const P=(e,t)=>{const i=e._$disconnectableChildren;if(i===void 0)return!1;for(const o of i)o._$notifyDirectiveConnectionChanged?.(t,!1),P(o,t);return!0},O=e=>{let t,i;do{if((t=e._$parent)===void 0)break;i=t._$disconnectableChildren,i.delete(e),e=t}while(i?.size===0)},N=e=>{for(let t;t=e._$parent;e=t){let i=t._$disconnectableChildren;if(i===void 0)t._$disconnectableChildren=i=new Set;else if(i.has(e))break;i.add(e),st(t)}};function at(e){this._$disconnectableChildren!==void 0?(O(this),this._$parent=e,N(this)):this._$parent=e}function nt(e,t=!1,i=0){const o=this._$committedValue,n=this._$disconnectableChildren;if(!(n===void 0||n.size===0))if(t)if(Array.isArray(o))for(let r=i;r<o.length;r++)P(o[r],!1),O(o[r]);else o!=null&&(P(o,!1),O(o));else P(this,e)}const st=e=>{e.type==F.CHILD&&(e._$notifyConnectionChanged??=nt,e._$reparentDisconnectables??=at)};class lt extends G{constructor(){super(...arguments),this._$disconnectableChildren=void 0}_$initialize(t,i,o){super._$initialize(t,i,o),N(this),this.isConnected=t._$isConnected}_$notifyDirectiveConnectionChanged(t,i=!0){t!==this.isConnected&&(this.isConnected=t,t?this.reconnected?.():this.disconnected?.()),i&&(P(this,t),O(this))}setValue(t){if(ot(this.__part))this.__part._$setValue(t,this);else{if(this.__attributeIndex===void 0)throw new Error("Expected this.__attributeIndex to be a number");const i=[...this.__part._$committedValue];i[this.__attributeIndex]=t,this.__part._$setValue(i,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ct{constructor(t){this._ref=t}disconnect(){this._ref=void 0}reconnect(t){this._ref=t}deref(){return this._ref}}class ut{constructor(){this._promise=void 0,this._resolve=void 0}get(){return this._promise}pause(){this._promise??=new Promise(t=>this._resolve=t)}resume(){this._resolve?.(),this._promise=this._resolve=void 0}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const j=e=>!rt(e)&&typeof e.then=="function",B=1073741823;class dt extends lt{constructor(){super(...arguments),this.__lastRenderedIndex=B,this.__values=[],this.__weakThis=new ct(this),this.__pauser=new ut}render(...t){return t.find(i=>!j(i))??A}update(t,i){const o=this.__values;let n=o.length;this.__values=i;const r=this.__weakThis,l=this.__pauser;this.isConnected||this.disconnected();for(let s=0;s<i.length&&!(s>this.__lastRenderedIndex);s++){const u=i[s];if(!j(u))return this.__lastRenderedIndex=s,u;s<n&&u===o[s]||(this.__lastRenderedIndex=B,n=0,Promise.resolve(u).then(async p=>{for(;l.get();)await l.get();const g=r.deref();if(g!==void 0){const V=g.__values.indexOf(u);V>-1&&V<g.__lastRenderedIndex&&(g.__lastRenderedIndex=V,g.setValue(p))}}))}return A}disconnected(){this.__weakThis.disconnect(),this.__pauser.pause()}reconnected(){this.__weakThis.reconnect(this),this.__pauser.resume()}}const _t=H(dt);class ht{constructor(){this.cache=new Map}set(t,i){this.cache.set(t,i)}get(t){return this.cache.get(t)}has(t){return this.cache.has(t)}delete(t){this.cache.delete(t)}clear(){this.cache.clear()}}const C=new ht,pt=b`
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
`;var D=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};const W={add:async()=>(await a(()=>import("./add-f1a26876.js"),["assets/add-f1a26876.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).addSvg,allWallets:async()=>(await a(()=>import("./all-wallets-b861b884.js"),["assets/all-wallets-b861b884.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).allWalletsSvg,arrowBottomCircle:async()=>(await a(()=>import("./arrow-bottom-circle-96cbbc28.js"),["assets/arrow-bottom-circle-96cbbc28.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).arrowBottomCircleSvg,appStore:async()=>(await a(()=>import("./app-store-902cdb25.js"),["assets/app-store-902cdb25.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).appStoreSvg,apple:async()=>(await a(()=>import("./apple-6e31b4c3.js"),["assets/apple-6e31b4c3.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).appleSvg,arrowBottom:async()=>(await a(()=>import("./arrow-bottom-c0be1a32.js"),["assets/arrow-bottom-c0be1a32.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).arrowBottomSvg,arrowLeft:async()=>(await a(()=>import("./arrow-left-4e2272b5.js"),["assets/arrow-left-4e2272b5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).arrowLeftSvg,arrowRight:async()=>(await a(()=>import("./arrow-right-cfc002cf.js"),["assets/arrow-right-cfc002cf.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).arrowRightSvg,arrowTop:async()=>(await a(()=>import("./arrow-top-96482285.js"),["assets/arrow-top-96482285.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).arrowTopSvg,bank:async()=>(await a(()=>import("./bank-33cb7e69.js"),["assets/bank-33cb7e69.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).bankSvg,browser:async()=>(await a(()=>import("./browser-f0946680.js"),["assets/browser-f0946680.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).browserSvg,card:async()=>(await a(()=>import("./card-6376786f.js"),["assets/card-6376786f.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).cardSvg,checkmark:async()=>(await a(()=>import("./checkmark-74164886.js"),["assets/checkmark-74164886.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).checkmarkSvg,checkmarkBold:async()=>(await a(()=>import("./checkmark-bold-1494b783.js"),["assets/checkmark-bold-1494b783.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).checkmarkBoldSvg,chevronBottom:async()=>(await a(()=>import("./chevron-bottom-9fd78613.js"),["assets/chevron-bottom-9fd78613.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).chevronBottomSvg,chevronLeft:async()=>(await a(()=>import("./chevron-left-8c0c6d68.js"),["assets/chevron-left-8c0c6d68.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).chevronLeftSvg,chevronRight:async()=>(await a(()=>import("./chevron-right-b96f4bbc.js"),["assets/chevron-right-b96f4bbc.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).chevronRightSvg,chevronTop:async()=>(await a(()=>import("./chevron-top-e86ff724.js"),["assets/chevron-top-e86ff724.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).chevronTopSvg,chromeStore:async()=>(await a(()=>import("./chrome-store-731cd96f.js"),["assets/chrome-store-731cd96f.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).chromeStoreSvg,clock:async()=>(await a(()=>import("./clock-9756536c.js"),["assets/clock-9756536c.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).clockSvg,close:async()=>(await a(()=>import("./close-3445234d.js"),["assets/close-3445234d.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).closeSvg,compass:async()=>(await a(()=>import("./compass-f972bc13.js"),["assets/compass-f972bc13.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).compassSvg,coinPlaceholder:async()=>(await a(()=>import("./coinPlaceholder-75506531.js"),["assets/coinPlaceholder-75506531.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).coinPlaceholderSvg,copy:async()=>(await a(()=>import("./copy-fdb4faa7.js"),["assets/copy-fdb4faa7.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).copySvg,cursor:async()=>(await a(()=>import("./cursor-41d4c404.js"),["assets/cursor-41d4c404.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).cursorSvg,cursorTransparent:async()=>(await a(()=>import("./cursor-transparent-d49982d8.js"),["assets/cursor-transparent-d49982d8.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).cursorTransparentSvg,desktop:async()=>(await a(()=>import("./desktop-5b266943.js"),["assets/desktop-5b266943.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).desktopSvg,disconnect:async()=>(await a(()=>import("./disconnect-af57a37d.js"),["assets/disconnect-af57a37d.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).disconnectSvg,discord:async()=>(await a(()=>import("./discord-860bb0f7.js"),["assets/discord-860bb0f7.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).discordSvg,etherscan:async()=>(await a(()=>import("./etherscan-b95d02ff.js"),["assets/etherscan-b95d02ff.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).etherscanSvg,extension:async()=>(await a(()=>import("./extension-3a4e2c32.js"),["assets/extension-3a4e2c32.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).extensionSvg,externalLink:async()=>(await a(()=>import("./external-link-7f4dc03b.js"),["assets/external-link-7f4dc03b.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).externalLinkSvg,facebook:async()=>(await a(()=>import("./facebook-28b55f75.js"),["assets/facebook-28b55f75.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).facebookSvg,farcaster:async()=>(await a(()=>import("./farcaster-5e6d3ed5.js"),["assets/farcaster-5e6d3ed5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).farcasterSvg,filters:async()=>(await a(()=>import("./filters-80119187.js"),["assets/filters-80119187.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).filtersSvg,github:async()=>(await a(()=>import("./github-8b9dd3c9.js"),["assets/github-8b9dd3c9.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).githubSvg,google:async()=>(await a(()=>import("./google-654a0b83.js"),["assets/google-654a0b83.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).googleSvg,helpCircle:async()=>(await a(()=>import("./help-circle-f2aeea92.js"),["assets/help-circle-f2aeea92.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).helpCircleSvg,image:async()=>(await a(()=>import("./image-d1675dc5.js"),["assets/image-d1675dc5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).imageSvg,id:async()=>(await a(()=>import("./id-3dfb4032.js"),["assets/id-3dfb4032.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).idSvg,infoCircle:async()=>(await a(()=>import("./info-circle-95febbb1.js"),["assets/info-circle-95febbb1.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).infoCircleSvg,lightbulb:async()=>(await a(()=>import("./lightbulb-beaa7452.js"),["assets/lightbulb-beaa7452.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).lightbulbSvg,mail:async()=>(await a(()=>import("./mail-bc068be7.js"),["assets/mail-bc068be7.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).mailSvg,mobile:async()=>(await a(()=>import("./mobile-99fdbde5.js"),["assets/mobile-99fdbde5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).mobileSvg,more:async()=>(await a(()=>import("./more-93086171.js"),["assets/more-93086171.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).moreSvg,networkPlaceholder:async()=>(await a(()=>import("./network-placeholder-a4bf269b.js"),["assets/network-placeholder-a4bf269b.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).networkPlaceholderSvg,nftPlaceholder:async()=>(await a(()=>import("./nftPlaceholder-aa505fe5.js"),["assets/nftPlaceholder-aa505fe5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).nftPlaceholderSvg,off:async()=>(await a(()=>import("./off-29b86151.js"),["assets/off-29b86151.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).offSvg,playStore:async()=>(await a(()=>import("./play-store-eae12974.js"),["assets/play-store-eae12974.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).playStoreSvg,plus:async()=>(await a(()=>import("./plus-45b40933.js"),["assets/plus-45b40933.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).plusSvg,qrCode:async()=>(await a(()=>import("./qr-code-8d7f5a7d.js"),["assets/qr-code-8d7f5a7d.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).qrCodeIcon,recycleHorizontal:async()=>(await a(()=>import("./recycle-horizontal-6dcf966d.js"),["assets/recycle-horizontal-6dcf966d.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).recycleHorizontalSvg,refresh:async()=>(await a(()=>import("./refresh-2ca1f9d9.js"),["assets/refresh-2ca1f9d9.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).refreshSvg,search:async()=>(await a(()=>import("./search-8e744b3d.js"),["assets/search-8e744b3d.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).searchSvg,send:async()=>(await a(()=>import("./send-1083935b.js"),["assets/send-1083935b.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).sendSvg,swapHorizontal:async()=>(await a(()=>import("./swapHorizontal-54f2efd5.js"),["assets/swapHorizontal-54f2efd5.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).swapHorizontalSvg,swapHorizontalMedium:async()=>(await a(()=>import("./swapHorizontalMedium-ccc5c5c0.js"),["assets/swapHorizontalMedium-ccc5c5c0.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await a(()=>import("./swapHorizontalBold-85cc1591.js"),["assets/swapHorizontalBold-85cc1591.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await a(()=>import("./swapHorizontalRoundedBold-b54fcbae.js"),["assets/swapHorizontalRoundedBold-b54fcbae.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await a(()=>import("./swapVertical-63c9a177.js"),["assets/swapVertical-63c9a177.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).swapVerticalSvg,telegram:async()=>(await a(()=>import("./telegram-608ef470.js"),["assets/telegram-608ef470.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).telegramSvg,threeDots:async()=>(await a(()=>import("./three-dots-deeb2b69.js"),["assets/three-dots-deeb2b69.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).threeDotsSvg,twitch:async()=>(await a(()=>import("./twitch-67608161.js"),["assets/twitch-67608161.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).twitchSvg,twitter:async()=>(await a(()=>import("./x-b0e5f5d0.js"),["assets/x-b0e5f5d0.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).xSvg,twitterIcon:async()=>(await a(()=>import("./twitterIcon-5030e9d3.js"),["assets/twitterIcon-5030e9d3.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).twitterIconSvg,verify:async()=>(await a(()=>import("./verify-f8542ab4.js"),["assets/verify-f8542ab4.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).verifySvg,verifyFilled:async()=>(await a(()=>import("./verify-filled-835d320b.js"),["assets/verify-filled-835d320b.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).verifyFilledSvg,wallet:async()=>(await a(()=>import("./wallet-33c67185.js"),["assets/wallet-33c67185.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).walletSvg,walletConnect:async()=>(await a(()=>import("./walletconnect-f9f57c50.js"),["assets/walletconnect-f9f57c50.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).walletConnectSvg,walletConnectLightBrown:async()=>(await a(()=>import("./walletconnect-f9f57c50.js"),["assets/walletconnect-f9f57c50.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await a(()=>import("./walletconnect-f9f57c50.js"),["assets/walletconnect-f9f57c50.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).walletConnectBrownSvg,walletPlaceholder:async()=>(await a(()=>import("./wallet-placeholder-31c88173.js"),["assets/wallet-placeholder-31c88173.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).walletPlaceholderSvg,warningCircle:async()=>(await a(()=>import("./warning-circle-70a9c689.js"),["assets/warning-circle-70a9c689.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).warningCircleSvg,x:async()=>(await a(()=>import("./x-b0e5f5d0.js"),["assets/x-b0e5f5d0.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).xSvg,info:async()=>(await a(()=>import("./info-5ccd4c5b.js"),["assets/info-5ccd4c5b.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).infoSvg,exclamationTriangle:async()=>(await a(()=>import("./exclamation-triangle-e8480696.js"),["assets/exclamation-triangle-e8480696.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).exclamationTriangleSvg,reown:async()=>(await a(()=>import("./reown-logo-c75d2202.js"),["assets/reown-logo-c75d2202.js","assets/core-085364e8.js","assets/wagmi-a145a347.js","assets/vendor-953f4813.js","assets/events-92540323.js","assets/index.es-dc7e6bd4.js"])).reownSvg};async function gt(e){if(C.has(e))return C.get(e);const i=(W[e]??W.copy)();return C.set(e,i),i}let m=class extends T{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,w`${_t(gt(this.name),w`<div class="fallback"></div>`)}`}};m.styles=[E,M,pt];D([c()],m.prototype,"size",void 0);D([c()],m.prototype,"name",void 0);D([c()],m.prototype,"color",void 0);D([c()],m.prototype,"aspectRatio",void 0);m=D([S("wui-icon")],m);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ft extends G{constructor(t){if(super(t),t.type!==F.ATTRIBUTE||t.name!=="class"||t.strings?.length>2)throw new Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(i=>t[i]).join(" ")+" "}update(t,[i]){if(this._previousClasses===void 0){this._previousClasses=new Set,t.strings!==void 0&&(this._staticClasses=new Set(t.strings.join(" ").split(/\s/).filter(n=>n!=="")));for(const n in i)i[n]&&!this._staticClasses?.has(n)&&this._previousClasses.add(n);return this.render(i)}const o=t.element.classList;for(const n of this._previousClasses)n in i||(o.remove(n),this._previousClasses.delete(n));for(const n in i){const r=!!i[n];r!==this._previousClasses.has(n)&&!this._staticClasses?.has(n)&&(r?(o.add(n),this._previousClasses.add(n)):(o.remove(n),this._previousClasses.delete(n)))}return A}}const vt=H(ft),wt=b`
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
`;var I=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let y=class extends T{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const t={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,w`<slot class=${vt(t)}></slot>`}};y.styles=[E,wt];I([c()],y.prototype,"variant",void 0);I([c()],y.prototype,"color",void 0);I([c()],y.prototype,"align",void 0);I([c()],y.prototype,"lineClamp",void 0);y=I([S("wui-text")],y);const mt=b`
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
`;var f=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let h=class extends T{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const t=this.iconSize||this.size,i=this.size==="lg",o=this.size==="xl",n=i?"12%":"16%",r=i?"xxs":o?"s":"3xl",l=this.background==="gray",s=this.background==="opaque",u=this.backgroundColor==="accent-100"&&s||this.backgroundColor==="success-100"&&s||this.backgroundColor==="error-100"&&s||this.backgroundColor==="inverse-100"&&s;let p=`var(--wui-color-${this.backgroundColor})`;return u?p=`var(--wui-icon-box-bg-${this.backgroundColor})`:l&&(p=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`
       --local-bg-value: ${p};
       --local-bg-mix: ${u||l?"100%":n};
       --local-border-radius: var(--wui-border-radius-${r});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor==="wui-color-bg-125"?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}
   `,w` <wui-icon color=${this.iconColor} size=${t} name=${this.icon}></wui-icon> `}};h.styles=[E,K,mt];f([c()],h.prototype,"size",void 0);f([c()],h.prototype,"backgroundColor",void 0);f([c()],h.prototype,"iconColor",void 0);f([c()],h.prototype,"iconSize",void 0);f([c()],h.prototype,"background",void 0);f([c({type:Boolean})],h.prototype,"border",void 0);f([c()],h.prototype,"borderColor",void 0);f([c()],h.prototype,"icon",void 0);h=f([S("wui-icon-box")],h);const yt=b`
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
`;var L=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let x=class extends T{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      `,w`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};x.styles=[E,M,yt];L([c()],x.prototype,"src",void 0);L([c()],x.prototype,"alt",void 0);L([c()],x.prototype,"size",void 0);x=L([S("wui-image")],x);const bt=b`
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
`;var z=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let R=class extends T{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const t=this.size==="md"?"mini-700":"micro-700";return w`
      <wui-text data-variant=${this.variant} variant=${t} color="inherit">
        <slot></slot>
      </wui-text>
    `}};R.styles=[E,bt];z([c()],R.prototype,"variant",void 0);z([c()],R.prototype,"size",void 0);R=z([S("wui-tag")],R);const Et=b`
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
`;var k=globalThis&&globalThis.__decorate||function(e,t,i,o){var n=arguments.length,r=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(l=e[s])&&(r=(n<3?l(r):n>3?l(t,i,r):l(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r};let $=class extends T{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText=`--local-color: ${this.color==="inherit"?"inherit":`var(--wui-color-${this.color})`}`,this.dataset.size=this.size,w`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};$.styles=[E,Et];k([c()],$.prototype,"color",void 0);k([c()],$.prototype,"size",void 0);$=k([S("wui-loading-spinner")],$);export{lt as A,v as U,vt as a,S as c,H as d,Rt as i,c as p,xt as s};
