/* @web/test-runner snapshot v1 */
export const snapshots = {};

snapshots["NsdTemplateUpdater given a nsd specced document shows the data loss dialog if (part of) selection is not in tree"] = 
`<div class="scrim">
</div>
<dialog
  aria-labelledby="headline"
  class="has-actions has-headline"
  open=""
>
  <div
    aria-hidden="true"
    class="focus-trap"
    tabindex="0"
  >
  </div>
  <div class="container">
    <div class="headline">
      <div
        aria-hidden="true"
        class="icon"
      >
        <slot name="icon">
        </slot>
      </div>
      <h2 id="headline">
        <slot name="headline">
        </slot>
      </h2>
      <md-divider>
      </md-divider>
    </div>
    <div class="scroller">
      <div class="content">
        <div class="anchor top">
        </div>
        <slot name="content">
        </slot>
        <div class="anchor bottom">
        </div>
      </div>
    </div>
    <div class="actions">
      <md-divider>
      </md-divider>
      <slot name="actions">
      </slot>
    </div>
  </div>
  <div
    aria-hidden="true"
    class="focus-trap"
    tabindex="0"
  >
  </div>
</dialog>
`;
/* end snapshot NsdTemplateUpdater given a nsd specced document shows the data loss dialog if (part of) selection is not in tree */

