const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/add-DjbTVVH1.js","assets/core-Ds1cJgBv.js","assets/index-CFXA30Ju.js","assets/index-CVGDeMNV.css","assets/events-CNvoZfz5.js","assets/index.es-BSMh7jGs.js","assets/all-wallets-D3k2uGj-.js","assets/arrow-bottom-circle-BKIPrlQb.js","assets/app-store-Wr3Tu8Y5.js","assets/apple-Ctc-8rNF.js","assets/arrow-bottom-4ONoDyqi.js","assets/arrow-left-c7x5TBZ1.js","assets/arrow-right-mf_rcJ0T.js","assets/arrow-top-CBiP1bGK.js","assets/bank-Cq6nEMRh.js","assets/browser-BpIEnORI.js","assets/card-BADlPD-c.js","assets/checkmark-DGgdmtYh.js","assets/checkmark-bold-B7fg7AjM.js","assets/chevron-bottom-D86i96Jv.js","assets/chevron-left-Dunh7E-x.js","assets/chevron-right-DCgxMSU3.js","assets/chevron-top-DCCoIBYE.js","assets/chrome-store-jpuqq-4J.js","assets/clock-CHLmZWYV.js","assets/close-C2m2sFWF.js","assets/compass-iTiKHhUP.js","assets/coinPlaceholder-z8M0X_pn.js","assets/copy-CPPL4Yxf.js","assets/cursor-Clud1pmr.js","assets/cursor-transparent-BWMAUJWn.js","assets/desktop-D7thsTCg.js","assets/disconnect-XBq-WcMk.js","assets/discord-B-nXHfZ1.js","assets/etherscan-DtZCbfkS.js","assets/extension-Ck9AuD6o.js","assets/external-link-P6tE_ONY.js","assets/facebook-DM0qJHUf.js","assets/farcaster-Bbx-to5_.js","assets/filters-CmuLPaky.js","assets/github-DXTJ7ML8.js","assets/google-B8tp5fWG.js","assets/help-circle-BKLcfFce.js","assets/image-DgPQ-uCv.js","assets/id-Byg1DYSl.js","assets/info-circle-53hDw-uk.js","assets/lightbulb-Cx6QyL_F.js","assets/mail-BnoUwuAU.js","assets/mobile-DxCKlqH6.js","assets/more-GivkKMVO.js","assets/network-placeholder-wT8izeGQ.js","assets/nftPlaceholder-Vrm1LY1X.js","assets/off-BHWnGA8b.js","assets/play-store-Clxk47C6.js","assets/plus-B-Ujevj3.js","assets/qr-code-BZsYEij3.js","assets/recycle-horizontal-bA99fJ5E.js","assets/refresh-BHIs44__.js","assets/search-D7Cdk5tL.js","assets/send--bvawa5Z.js","assets/swapHorizontal-2_1oFn-q.js","assets/swapHorizontalMedium-BhNhLsRT.js","assets/swapHorizontalBold-GDqn3DIY.js","assets/swapHorizontalRoundedBold-CBITcX-n.js","assets/swapVertical-sANwOLLS.js","assets/telegram-CoqHUAHg.js","assets/three-dots-C_fdP5d5.js","assets/twitch-WH-fXmJ8.js","assets/x-DcV4XLcw.js","assets/twitterIcon-aaZMDjbU.js","assets/verify-Coh4Seag.js","assets/verify-filled-Yu-DPnkF.js","assets/wallet-Cq7niqvE.js","assets/walletconnect-_23tCD5I.js","assets/wallet-placeholder-hxDEeifh.js","assets/warning-circle-jHHBcwad.js","assets/info-CRTekUMm.js","assets/exclamation-triangle-B08rru36.js","assets/reown-logo-EQ58a0JS.js"])))=>i.map(i=>d[i]);
import{I as N,J as Y,k as S,l as b,L as E,m as f,K as J,N as A,o as M,n as K}from"./core-Ds1cJgBv.js";import{x as o}from"./index-CFXA30Ju.js";const w={getSpacingStyles(t,e){if(Array.isArray(t))return t[e]?`var(--wui-spacing-${t[e]})`:void 0;if(typeof t=="string")return`var(--wui-spacing-${t})`},getFormattedDate(t){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t)},getHostName(t){try{return new URL(t).hostname}catch{return""}},getTruncateString({string:t,charsStart:e,charsEnd:i,truncate:a}){return t.length<=e+i?t:a==="end"?`${t.substring(0,e)}...`:a==="start"?`...${t.substring(t.length-i)}`:`${t.substring(0,Math.floor(e))}...${t.substring(t.length-Math.floor(i))}`},generateAvatarColors(t){const i=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),a=this.hexToRgb(i),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),c=100-3*Number(n?.replace("px","")),s=`${c}% ${c}% at 65% 40%`,u=[];for(let p=0;p<5;p+=1){const g=this.tintColor(a,.15*p);u.push(`rgb(${g[0]}, ${g[1]}, ${g[2]})`)}return`
    --local-color-1: ${u[0]};
    --local-color-2: ${u[1]};
    --local-color-3: ${u[2]};
    --local-color-4: ${u[3]};
    --local-color-5: ${u[4]};
    --local-radial-circle: ${s}
   `},hexToRgb(t){const e=parseInt(t,16),i=e>>16&255,a=e>>8&255,n=e&255;return[i,a,n]},tintColor(t,e){const[i,a,n]=t,r=Math.round(i+(255-i)*e),c=Math.round(a+(255-a)*e),s=Math.round(n+(255-n)*e);return[r,c,s]},isNumber(t){return{number:/^[0-9]+$/u}.number.test(t)},getColorTheme(t){return t||(typeof window<"u"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)")?.matches?"dark":"light":"dark")},splitBalance(t){const e=t.split(".");return e.length===2?[e[0],e[1]]:["0","00"]},roundNumber(t,e,i){return t.toString().length>=e?Number(t).toFixed(i):t},formatNumberToLocalString(t,e=2){return t===void 0?"0.00":typeof t=="number"?t.toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e})}};function X(t,e){const{kind:i,elements:a}=e;return{kind:i,elements:a,finisher(n){customElements.get(t)||customElements.define(t,n)}}}function Q(t,e){return customElements.get(t)||customElements.define(t,e),e}function x(t){return function(i){return typeof i=="function"?Q(t,i):X(t,i)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let H;globalThis.litIssuedWarnings??=new Set,H=(t,e)=>{e+=` See https://lit.dev/msg/${t} for more information.`,!globalThis.litIssuedWarnings.has(e)&&!globalThis.litIssuedWarnings.has(t)&&(console.warn(e),globalThis.litIssuedWarnings.add(e))};const Z=(t,e,i)=>{const a=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),a?Object.getOwnPropertyDescriptor(e,i):void 0},tt={attribute:!0,type:String,converter:Y,reflect:!1,hasChanged:N},et=(t=tt,e,i)=>{const{kind:a,metadata:n}=i;n==null&&H("missing-class-metadata",`The class ${e} is missing decorator metadata. This could mean that you're using a compiler that supports decorators but doesn't support decorator metadata, such as TypeScript 5.1. Please update your compiler.`);let r=globalThis.litPropertyMetadata.get(n);if(r===void 0&&globalThis.litPropertyMetadata.set(n,r=new Map),a==="setter"&&(t=Object.create(t),t.wrapped=!0),r.set(i.name,t),a==="accessor"){const{name:c}=i;return{set(s){const u=e.get.call(this);e.set.call(this,s),this.requestUpdate(c,u,t)},init(s){return s!==void 0&&this._$changeProperty(c,void 0,t,s),s}}}else if(a==="setter"){const{name:c}=i;return function(s){const u=this[c];e.call(this,s),this.requestUpdate(c,u,t)}}throw new Error(`Unsupported decorator location: ${a}`)};function l(t){return(e,i)=>typeof i=="object"?et(t,e,i):Z(t,e,i)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Pt(t){return l({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */globalThis.litIssuedWarnings??=new Set;const it=S`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var _=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let d=class extends E{render(){return this.style.cssText=`
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
      padding-top: ${this.padding&&w.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&w.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&w.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&w.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&w.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&w.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&w.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&w.getSpacingStyles(this.margin,3)};
    `,f`<slot></slot>`}};d.styles=[b,it];_([l()],d.prototype,"flexDirection",void 0);_([l()],d.prototype,"flexWrap",void 0);_([l()],d.prototype,"flexBasis",void 0);_([l()],d.prototype,"flexGrow",void 0);_([l()],d.prototype,"flexShrink",void 0);_([l()],d.prototype,"alignItems",void 0);_([l()],d.prototype,"justifyContent",void 0);_([l()],d.prototype,"columnGap",void 0);_([l()],d.prototype,"rowGap",void 0);_([l()],d.prototype,"gap",void 0);_([l()],d.prototype,"padding",void 0);_([l()],d.prototype,"margin",void 0);d=_([x("wui-flex")],d);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Rt=t=>t??J;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */window.ShadyDOM?.inUse&&window.ShadyDOM?.noPatch===!0&&window.ShadyDOM.wrap;const rt=t=>t===null||typeof t!="object"&&typeof t!="function",ot=t=>t.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const U={ATTRIBUTE:1,CHILD:2},F=t=>(...e)=>({_$litDirective$:t,values:e});class G{constructor(e){}get _$isConnected(){return this._$parent._$isConnected}_$initialize(e,i,a){this.__part=e,this._$parent=i,this.__attributeIndex=a}_$resolve(e,i){return this.update(e,i)}update(e,i){return this.render(...i)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const T=(t,e)=>{const i=t._$disconnectableChildren;if(i===void 0)return!1;for(const a of i)a._$notifyDirectiveConnectionChanged?.(e,!1),T(a,e);return!0},L=t=>{let e,i;do{if((e=t._$parent)===void 0)break;i=e._$disconnectableChildren,i.delete(t),t=e}while(i?.size===0)},q=t=>{for(let e;e=t._$parent;t=e){let i=e._$disconnectableChildren;if(i===void 0)e._$disconnectableChildren=i=new Set;else if(i.has(t))break;i.add(t),st(e)}};function at(t){this._$disconnectableChildren!==void 0?(L(this),this._$parent=t,q(this)):this._$parent=t}function nt(t,e=!1,i=0){const a=this._$committedValue,n=this._$disconnectableChildren;if(!(n===void 0||n.size===0))if(e)if(Array.isArray(a))for(let r=i;r<a.length;r++)T(a[r],!1),L(a[r]);else a!=null&&(T(a,!1),L(a));else T(this,t)}const st=t=>{t.type==U.CHILD&&(t._$notifyConnectionChanged??=nt,t._$reparentDisconnectables??=at)};class ct extends G{constructor(){super(...arguments),this._$disconnectableChildren=void 0}_$initialize(e,i,a){super._$initialize(e,i,a),q(this),this.isConnected=e._$isConnected}_$notifyDirectiveConnectionChanged(e,i=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),i&&(T(this,e),L(this))}setValue(e){if(ot(this.__part))this.__part._$setValue(e,this);else{if(this.__attributeIndex===void 0)throw new Error("Expected this.__attributeIndex to be a number");const i=[...this.__part._$committedValue];i[this.__attributeIndex]=e,this.__part._$setValue(i,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class lt{constructor(e){this._ref=e}disconnect(){this._ref=void 0}reconnect(e){this._ref=e}deref(){return this._ref}}class ut{constructor(){this._promise=void 0,this._resolve=void 0}get(){return this._promise}pause(){this._promise??=new Promise(e=>this._resolve=e)}resume(){this._resolve?.(),this._promise=this._resolve=void 0}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const B=t=>!rt(t)&&typeof t.then=="function",j=1073741823;class dt extends ct{constructor(){super(...arguments),this.__lastRenderedIndex=j,this.__values=[],this.__weakThis=new lt(this),this.__pauser=new ut}render(...e){return e.find(i=>!B(i))??A}update(e,i){const a=this.__values;let n=a.length;this.__values=i;const r=this.__weakThis,c=this.__pauser;this.isConnected||this.disconnected();for(let s=0;s<i.length&&!(s>this.__lastRenderedIndex);s++){const u=i[s];if(!B(u))return this.__lastRenderedIndex=s,u;s<n&&u===a[s]||(this.__lastRenderedIndex=j,n=0,Promise.resolve(u).then(async p=>{for(;c.get();)await c.get();const g=r.deref();if(g!==void 0){const C=g.__values.indexOf(u);C>-1&&C<g.__lastRenderedIndex&&(g.__lastRenderedIndex=C,g.setValue(p))}}))}return A}disconnected(){this.__weakThis.disconnect(),this.__pauser.pause()}reconnected(){this.__weakThis.reconnect(this),this.__pauser.resume()}}const _t=F(dt);class ht{constructor(){this.cache=new Map}set(e,i){this.cache.set(e,i)}get(e){return this.cache.get(e)}has(e){return this.cache.has(e)}delete(e){this.cache.delete(e)}clear(){this.cache.clear()}}const V=new ht,pt=S`
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
`;var D=function(t,e,i,a){var n=arguments.length,r=n<3?e:a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};const W={add:async()=>(await o(async()=>{const{addSvg:t}=await import("./add-DjbTVVH1.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5]))).addSvg,allWallets:async()=>(await o(async()=>{const{allWalletsSvg:t}=await import("./all-wallets-D3k2uGj-.js");return{allWalletsSvg:t}},__vite__mapDeps([6,1,2,3,4,5]))).allWalletsSvg,arrowBottomCircle:async()=>(await o(async()=>{const{arrowBottomCircleSvg:t}=await import("./arrow-bottom-circle-BKIPrlQb.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([7,1,2,3,4,5]))).arrowBottomCircleSvg,appStore:async()=>(await o(async()=>{const{appStoreSvg:t}=await import("./app-store-Wr3Tu8Y5.js");return{appStoreSvg:t}},__vite__mapDeps([8,1,2,3,4,5]))).appStoreSvg,apple:async()=>(await o(async()=>{const{appleSvg:t}=await import("./apple-Ctc-8rNF.js");return{appleSvg:t}},__vite__mapDeps([9,1,2,3,4,5]))).appleSvg,arrowBottom:async()=>(await o(async()=>{const{arrowBottomSvg:t}=await import("./arrow-bottom-4ONoDyqi.js");return{arrowBottomSvg:t}},__vite__mapDeps([10,1,2,3,4,5]))).arrowBottomSvg,arrowLeft:async()=>(await o(async()=>{const{arrowLeftSvg:t}=await import("./arrow-left-c7x5TBZ1.js");return{arrowLeftSvg:t}},__vite__mapDeps([11,1,2,3,4,5]))).arrowLeftSvg,arrowRight:async()=>(await o(async()=>{const{arrowRightSvg:t}=await import("./arrow-right-mf_rcJ0T.js");return{arrowRightSvg:t}},__vite__mapDeps([12,1,2,3,4,5]))).arrowRightSvg,arrowTop:async()=>(await o(async()=>{const{arrowTopSvg:t}=await import("./arrow-top-CBiP1bGK.js");return{arrowTopSvg:t}},__vite__mapDeps([13,1,2,3,4,5]))).arrowTopSvg,bank:async()=>(await o(async()=>{const{bankSvg:t}=await import("./bank-Cq6nEMRh.js");return{bankSvg:t}},__vite__mapDeps([14,1,2,3,4,5]))).bankSvg,browser:async()=>(await o(async()=>{const{browserSvg:t}=await import("./browser-BpIEnORI.js");return{browserSvg:t}},__vite__mapDeps([15,1,2,3,4,5]))).browserSvg,card:async()=>(await o(async()=>{const{cardSvg:t}=await import("./card-BADlPD-c.js");return{cardSvg:t}},__vite__mapDeps([16,1,2,3,4,5]))).cardSvg,checkmark:async()=>(await o(async()=>{const{checkmarkSvg:t}=await import("./checkmark-DGgdmtYh.js");return{checkmarkSvg:t}},__vite__mapDeps([17,1,2,3,4,5]))).checkmarkSvg,checkmarkBold:async()=>(await o(async()=>{const{checkmarkBoldSvg:t}=await import("./checkmark-bold-B7fg7AjM.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([18,1,2,3,4,5]))).checkmarkBoldSvg,chevronBottom:async()=>(await o(async()=>{const{chevronBottomSvg:t}=await import("./chevron-bottom-D86i96Jv.js");return{chevronBottomSvg:t}},__vite__mapDeps([19,1,2,3,4,5]))).chevronBottomSvg,chevronLeft:async()=>(await o(async()=>{const{chevronLeftSvg:t}=await import("./chevron-left-Dunh7E-x.js");return{chevronLeftSvg:t}},__vite__mapDeps([20,1,2,3,4,5]))).chevronLeftSvg,chevronRight:async()=>(await o(async()=>{const{chevronRightSvg:t}=await import("./chevron-right-DCgxMSU3.js");return{chevronRightSvg:t}},__vite__mapDeps([21,1,2,3,4,5]))).chevronRightSvg,chevronTop:async()=>(await o(async()=>{const{chevronTopSvg:t}=await import("./chevron-top-DCCoIBYE.js");return{chevronTopSvg:t}},__vite__mapDeps([22,1,2,3,4,5]))).chevronTopSvg,chromeStore:async()=>(await o(async()=>{const{chromeStoreSvg:t}=await import("./chrome-store-jpuqq-4J.js");return{chromeStoreSvg:t}},__vite__mapDeps([23,1,2,3,4,5]))).chromeStoreSvg,clock:async()=>(await o(async()=>{const{clockSvg:t}=await import("./clock-CHLmZWYV.js");return{clockSvg:t}},__vite__mapDeps([24,1,2,3,4,5]))).clockSvg,close:async()=>(await o(async()=>{const{closeSvg:t}=await import("./close-C2m2sFWF.js");return{closeSvg:t}},__vite__mapDeps([25,1,2,3,4,5]))).closeSvg,compass:async()=>(await o(async()=>{const{compassSvg:t}=await import("./compass-iTiKHhUP.js");return{compassSvg:t}},__vite__mapDeps([26,1,2,3,4,5]))).compassSvg,coinPlaceholder:async()=>(await o(async()=>{const{coinPlaceholderSvg:t}=await import("./coinPlaceholder-z8M0X_pn.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([27,1,2,3,4,5]))).coinPlaceholderSvg,copy:async()=>(await o(async()=>{const{copySvg:t}=await import("./copy-CPPL4Yxf.js");return{copySvg:t}},__vite__mapDeps([28,1,2,3,4,5]))).copySvg,cursor:async()=>(await o(async()=>{const{cursorSvg:t}=await import("./cursor-Clud1pmr.js");return{cursorSvg:t}},__vite__mapDeps([29,1,2,3,4,5]))).cursorSvg,cursorTransparent:async()=>(await o(async()=>{const{cursorTransparentSvg:t}=await import("./cursor-transparent-BWMAUJWn.js");return{cursorTransparentSvg:t}},__vite__mapDeps([30,1,2,3,4,5]))).cursorTransparentSvg,desktop:async()=>(await o(async()=>{const{desktopSvg:t}=await import("./desktop-D7thsTCg.js");return{desktopSvg:t}},__vite__mapDeps([31,1,2,3,4,5]))).desktopSvg,disconnect:async()=>(await o(async()=>{const{disconnectSvg:t}=await import("./disconnect-XBq-WcMk.js");return{disconnectSvg:t}},__vite__mapDeps([32,1,2,3,4,5]))).disconnectSvg,discord:async()=>(await o(async()=>{const{discordSvg:t}=await import("./discord-B-nXHfZ1.js");return{discordSvg:t}},__vite__mapDeps([33,1,2,3,4,5]))).discordSvg,etherscan:async()=>(await o(async()=>{const{etherscanSvg:t}=await import("./etherscan-DtZCbfkS.js");return{etherscanSvg:t}},__vite__mapDeps([34,1,2,3,4,5]))).etherscanSvg,extension:async()=>(await o(async()=>{const{extensionSvg:t}=await import("./extension-Ck9AuD6o.js");return{extensionSvg:t}},__vite__mapDeps([35,1,2,3,4,5]))).extensionSvg,externalLink:async()=>(await o(async()=>{const{externalLinkSvg:t}=await import("./external-link-P6tE_ONY.js");return{externalLinkSvg:t}},__vite__mapDeps([36,1,2,3,4,5]))).externalLinkSvg,facebook:async()=>(await o(async()=>{const{facebookSvg:t}=await import("./facebook-DM0qJHUf.js");return{facebookSvg:t}},__vite__mapDeps([37,1,2,3,4,5]))).facebookSvg,farcaster:async()=>(await o(async()=>{const{farcasterSvg:t}=await import("./farcaster-Bbx-to5_.js");return{farcasterSvg:t}},__vite__mapDeps([38,1,2,3,4,5]))).farcasterSvg,filters:async()=>(await o(async()=>{const{filtersSvg:t}=await import("./filters-CmuLPaky.js");return{filtersSvg:t}},__vite__mapDeps([39,1,2,3,4,5]))).filtersSvg,github:async()=>(await o(async()=>{const{githubSvg:t}=await import("./github-DXTJ7ML8.js");return{githubSvg:t}},__vite__mapDeps([40,1,2,3,4,5]))).githubSvg,google:async()=>(await o(async()=>{const{googleSvg:t}=await import("./google-B8tp5fWG.js");return{googleSvg:t}},__vite__mapDeps([41,1,2,3,4,5]))).googleSvg,helpCircle:async()=>(await o(async()=>{const{helpCircleSvg:t}=await import("./help-circle-BKLcfFce.js");return{helpCircleSvg:t}},__vite__mapDeps([42,1,2,3,4,5]))).helpCircleSvg,image:async()=>(await o(async()=>{const{imageSvg:t}=await import("./image-DgPQ-uCv.js");return{imageSvg:t}},__vite__mapDeps([43,1,2,3,4,5]))).imageSvg,id:async()=>(await o(async()=>{const{idSvg:t}=await import("./id-Byg1DYSl.js");return{idSvg:t}},__vite__mapDeps([44,1,2,3,4,5]))).idSvg,infoCircle:async()=>(await o(async()=>{const{infoCircleSvg:t}=await import("./info-circle-53hDw-uk.js");return{infoCircleSvg:t}},__vite__mapDeps([45,1,2,3,4,5]))).infoCircleSvg,lightbulb:async()=>(await o(async()=>{const{lightbulbSvg:t}=await import("./lightbulb-Cx6QyL_F.js");return{lightbulbSvg:t}},__vite__mapDeps([46,1,2,3,4,5]))).lightbulbSvg,mail:async()=>(await o(async()=>{const{mailSvg:t}=await import("./mail-BnoUwuAU.js");return{mailSvg:t}},__vite__mapDeps([47,1,2,3,4,5]))).mailSvg,mobile:async()=>(await o(async()=>{const{mobileSvg:t}=await import("./mobile-DxCKlqH6.js");return{mobileSvg:t}},__vite__mapDeps([48,1,2,3,4,5]))).mobileSvg,more:async()=>(await o(async()=>{const{moreSvg:t}=await import("./more-GivkKMVO.js");return{moreSvg:t}},__vite__mapDeps([49,1,2,3,4,5]))).moreSvg,networkPlaceholder:async()=>(await o(async()=>{const{networkPlaceholderSvg:t}=await import("./network-placeholder-wT8izeGQ.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([50,1,2,3,4,5]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await o(async()=>{const{nftPlaceholderSvg:t}=await import("./nftPlaceholder-Vrm1LY1X.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([51,1,2,3,4,5]))).nftPlaceholderSvg,off:async()=>(await o(async()=>{const{offSvg:t}=await import("./off-BHWnGA8b.js");return{offSvg:t}},__vite__mapDeps([52,1,2,3,4,5]))).offSvg,playStore:async()=>(await o(async()=>{const{playStoreSvg:t}=await import("./play-store-Clxk47C6.js");return{playStoreSvg:t}},__vite__mapDeps([53,1,2,3,4,5]))).playStoreSvg,plus:async()=>(await o(async()=>{const{plusSvg:t}=await import("./plus-B-Ujevj3.js");return{plusSvg:t}},__vite__mapDeps([54,1,2,3,4,5]))).plusSvg,qrCode:async()=>(await o(async()=>{const{qrCodeIcon:t}=await import("./qr-code-BZsYEij3.js");return{qrCodeIcon:t}},__vite__mapDeps([55,1,2,3,4,5]))).qrCodeIcon,recycleHorizontal:async()=>(await o(async()=>{const{recycleHorizontalSvg:t}=await import("./recycle-horizontal-bA99fJ5E.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([56,1,2,3,4,5]))).recycleHorizontalSvg,refresh:async()=>(await o(async()=>{const{refreshSvg:t}=await import("./refresh-BHIs44__.js");return{refreshSvg:t}},__vite__mapDeps([57,1,2,3,4,5]))).refreshSvg,search:async()=>(await o(async()=>{const{searchSvg:t}=await import("./search-D7Cdk5tL.js");return{searchSvg:t}},__vite__mapDeps([58,1,2,3,4,5]))).searchSvg,send:async()=>(await o(async()=>{const{sendSvg:t}=await import("./send--bvawa5Z.js");return{sendSvg:t}},__vite__mapDeps([59,1,2,3,4,5]))).sendSvg,swapHorizontal:async()=>(await o(async()=>{const{swapHorizontalSvg:t}=await import("./swapHorizontal-2_1oFn-q.js");return{swapHorizontalSvg:t}},__vite__mapDeps([60,1,2,3,4,5]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await o(async()=>{const{swapHorizontalMediumSvg:t}=await import("./swapHorizontalMedium-BhNhLsRT.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([61,1,2,3,4,5]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await o(async()=>{const{swapHorizontalBoldSvg:t}=await import("./swapHorizontalBold-GDqn3DIY.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([62,1,2,3,4,5]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await o(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./swapHorizontalRoundedBold-CBITcX-n.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([63,1,2,3,4,5]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await o(async()=>{const{swapVerticalSvg:t}=await import("./swapVertical-sANwOLLS.js");return{swapVerticalSvg:t}},__vite__mapDeps([64,1,2,3,4,5]))).swapVerticalSvg,telegram:async()=>(await o(async()=>{const{telegramSvg:t}=await import("./telegram-CoqHUAHg.js");return{telegramSvg:t}},__vite__mapDeps([65,1,2,3,4,5]))).telegramSvg,threeDots:async()=>(await o(async()=>{const{threeDotsSvg:t}=await import("./three-dots-C_fdP5d5.js");return{threeDotsSvg:t}},__vite__mapDeps([66,1,2,3,4,5]))).threeDotsSvg,twitch:async()=>(await o(async()=>{const{twitchSvg:t}=await import("./twitch-WH-fXmJ8.js");return{twitchSvg:t}},__vite__mapDeps([67,1,2,3,4,5]))).twitchSvg,twitter:async()=>(await o(async()=>{const{xSvg:t}=await import("./x-DcV4XLcw.js");return{xSvg:t}},__vite__mapDeps([68,1,2,3,4,5]))).xSvg,twitterIcon:async()=>(await o(async()=>{const{twitterIconSvg:t}=await import("./twitterIcon-aaZMDjbU.js");return{twitterIconSvg:t}},__vite__mapDeps([69,1,2,3,4,5]))).twitterIconSvg,verify:async()=>(await o(async()=>{const{verifySvg:t}=await import("./verify-Coh4Seag.js");return{verifySvg:t}},__vite__mapDeps([70,1,2,3,4,5]))).verifySvg,verifyFilled:async()=>(await o(async()=>{const{verifyFilledSvg:t}=await import("./verify-filled-Yu-DPnkF.js");return{verifyFilledSvg:t}},__vite__mapDeps([71,1,2,3,4,5]))).verifyFilledSvg,wallet:async()=>(await o(async()=>{const{walletSvg:t}=await import("./wallet-Cq7niqvE.js");return{walletSvg:t}},__vite__mapDeps([72,1,2,3,4,5]))).walletSvg,walletConnect:async()=>(await o(async()=>{const{walletConnectSvg:t}=await import("./walletconnect-_23tCD5I.js");return{walletConnectSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectSvg,walletConnectLightBrown:async()=>(await o(async()=>{const{walletConnectLightBrownSvg:t}=await import("./walletconnect-_23tCD5I.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await o(async()=>{const{walletConnectBrownSvg:t}=await import("./walletconnect-_23tCD5I.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([73,1,2,3,4,5]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await o(async()=>{const{walletPlaceholderSvg:t}=await import("./wallet-placeholder-hxDEeifh.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([74,1,2,3,4,5]))).walletPlaceholderSvg,warningCircle:async()=>(await o(async()=>{const{warningCircleSvg:t}=await import("./warning-circle-jHHBcwad.js");return{warningCircleSvg:t}},__vite__mapDeps([75,1,2,3,4,5]))).warningCircleSvg,x:async()=>(await o(async()=>{const{xSvg:t}=await import("./x-DcV4XLcw.js");return{xSvg:t}},__vite__mapDeps([68,1,2,3,4,5]))).xSvg,info:async()=>(await o(async()=>{const{infoSvg:t}=await import("./info-CRTekUMm.js");return{infoSvg:t}},__vite__mapDeps([76,1,2,3,4,5]))).infoSvg,exclamationTriangle:async()=>(await o(async()=>{const{exclamationTriangleSvg:t}=await import("./exclamation-triangle-B08rru36.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([77,1,2,3,4,5]))).exclamationTriangleSvg,reown:async()=>(await o(async()=>{const{reownSvg:t}=await import("./reown-logo-EQ58a0JS.js");return{reownSvg:t}},__vite__mapDeps([78,1,2,3,4,5]))).reownSvg};async function gt(t){if(V.has(t))return V.get(t);const i=(W[t]??W.copy)();return V.set(t,i),i}let m=class extends E{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,f`${_t(gt(this.name),f`<div class="fallback"></div>`)}`}};m.styles=[b,M,pt];D([l()],m.prototype,"size",void 0);D([l()],m.prototype,"name",void 0);D([l()],m.prototype,"color",void 0);D([l()],m.prototype,"aspectRatio",void 0);m=D([x("wui-icon")],m);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class vt extends G{constructor(e){if(super(e),e.type!==U.ATTRIBUTE||e.name!=="class"||e.strings?.length>2)throw new Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(i=>e[i]).join(" ")+" "}update(e,[i]){if(this._previousClasses===void 0){this._previousClasses=new Set,e.strings!==void 0&&(this._staticClasses=new Set(e.strings.join(" ").split(/\s/).filter(n=>n!=="")));for(const n in i)i[n]&&!this._staticClasses?.has(n)&&this._previousClasses.add(n);return this.render(i)}const a=e.element.classList;for(const n of this._previousClasses)n in i||(a.remove(n),this._previousClasses.delete(n));for(const n in i){const r=!!i[n];r!==this._previousClasses.has(n)&&!this._staticClasses?.has(n)&&(r?(a.add(n),this._previousClasses.add(n)):(a.remove(n),this._previousClasses.delete(n)))}return A}}const wt=F(vt),ft=S`
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
`;var I=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let y=class extends E{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const e={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,f`<slot class=${wt(e)}></slot>`}};y.styles=[b,ft];I([l()],y.prototype,"variant",void 0);I([l()],y.prototype,"color",void 0);I([l()],y.prototype,"align",void 0);I([l()],y.prototype,"lineClamp",void 0);y=I([x("wui-text")],y);const mt=S`
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
`;var v=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let h=class extends E{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const e=this.iconSize||this.size,i=this.size==="lg",a=this.size==="xl",n=i?"12%":"16%",r=i?"xxs":a?"s":"3xl",c=this.background==="gray",s=this.background==="opaque",u=this.backgroundColor==="accent-100"&&s||this.backgroundColor==="success-100"&&s||this.backgroundColor==="error-100"&&s||this.backgroundColor==="inverse-100"&&s;let p=`var(--wui-color-${this.backgroundColor})`;return u?p=`var(--wui-icon-box-bg-${this.backgroundColor})`:c&&(p=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`
       --local-bg-value: ${p};
       --local-bg-mix: ${u||c?"100%":n};
       --local-border-radius: var(--wui-border-radius-${r});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor==="wui-color-bg-125"?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}
   `,f` <wui-icon color=${this.iconColor} size=${e} name=${this.icon}></wui-icon> `}};h.styles=[b,K,mt];v([l()],h.prototype,"size",void 0);v([l()],h.prototype,"backgroundColor",void 0);v([l()],h.prototype,"iconColor",void 0);v([l()],h.prototype,"iconSize",void 0);v([l()],h.prototype,"background",void 0);v([l({type:Boolean})],h.prototype,"border",void 0);v([l()],h.prototype,"borderColor",void 0);v([l()],h.prototype,"icon",void 0);h=v([x("wui-icon-box")],h);const yt=S`
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
`;var O=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let P=class extends E{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      `,f`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};P.styles=[b,M,yt];O([l()],P.prototype,"src",void 0);O([l()],P.prototype,"alt",void 0);O([l()],P.prototype,"size",void 0);P=O([x("wui-image")],P);const St=S`
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
`;var z=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let R=class extends E{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const e=this.size==="md"?"mini-700":"micro-700";return f`
      <wui-text data-variant=${this.variant} variant=${e} color="inherit">
        <slot></slot>
      </wui-text>
    `}};R.styles=[b,St];z([l()],R.prototype,"variant",void 0);z([l()],R.prototype,"size",void 0);R=z([x("wui-tag")],R);const bt=S`
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
`;var k=function(t,e,i,a){var n=arguments.length,r=n<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,i):a,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,i,a);else for(var s=t.length-1;s>=0;s--)(c=t[s])&&(r=(n<3?c(r):n>3?c(e,i,r):c(e,i))||r);return n>3&&r&&Object.defineProperty(e,i,r),r};let $=class extends E{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText=`--local-color: ${this.color==="inherit"?"inherit":`var(--wui-color-${this.color})`}`,this.dataset.size=this.size,f`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};$.styles=[b,bt];k([l()],$.prototype,"color",void 0);k([l()],$.prototype,"size",void 0);$=k([x("wui-loading-spinner")],$);export{ct as A,w as U,wt as a,x as c,F as d,Rt as i,l as p,Pt as s};
