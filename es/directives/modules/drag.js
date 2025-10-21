/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { DirectiveBase } from '../base/directive-base.js';
import { defineDirective, directiveUtils } from '../base/vue-directive-adapter.js';

class DragDirective extends DirectiveBase {
  constructor() {
    super({
      name: "drag",
      description: "\u4F7F\u5143\u7D20\u53EF\u62D6\u62FD\u79FB\u52A8",
      version: "1.0.0",
      category: "interaction",
      tags: ["drag", "draggable", "move", "interaction"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (config.disabled) {
      return;
    }
    const state = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      offsetX: 0,
      offsetY: 0
    };
    const handle = this.getHandle(el, config.handle);
    if (!el.style.position || el.style.position === "static") {
      el.style.position = "relative";
    }
    const handleStart = (e) => {
      if (config.disabled)
        return;
      state.isDragging = true;
      const point = this.getEventPoint(e);
      state.startX = point.x - state.offsetX;
      state.startY = point.y - state.offsetY;
      document.body.style.cursor = config.cursor ?? "move";
      el.style.cursor = config.cursor ?? "move";
      document.body.style.userSelect = "none";
      if (config.onStart) {
        config.onStart({ el, state, originalEvent: e });
      }
      if (config.preventDefault)
        e.preventDefault();
      if (config.stopPropagation)
        e.stopPropagation();
      this.log("Drag started", state);
    };
    const handleMove = (e) => {
      if (!state.isDragging)
        return;
      const point = this.getEventPoint(e);
      let newX = point.x - state.startX;
      let newY = point.y - state.startY;
      if (config.axis === "x") {
        newY = state.offsetY;
      } else if (config.axis === "y") {
        newX = state.offsetX;
      }
      if (config.constraint) {
        const bounds = this.getConstraintBounds(el, config.constraint);
        newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX));
        newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY));
      }
      state.currentX = newX;
      state.currentY = newY;
      state.offsetX = newX;
      state.offsetY = newY;
      el.style.transform = `translate(${newX}px, ${newY}px)`;
      if (config.onMove) {
        config.onMove({ el, state, originalEvent: e });
      }
      if (config.preventDefault)
        e.preventDefault();
      if (config.stopPropagation)
        e.stopPropagation();
    };
    const handleEnd = (e) => {
      if (!state.isDragging)
        return;
      state.isDragging = false;
      document.body.style.cursor = "";
      el.style.cursor = "";
      document.body.style.userSelect = "";
      if (config.onEnd) {
        config.onEnd({ el, state, originalEvent: e });
      }
      this.log("Drag ended", state);
    };
    const handlers = { handleStart, handleMove, handleEnd };
    directiveUtils.storeData(el, "drag-handlers", handlers);
    directiveUtils.storeData(el, "drag-state", state);
    directiveUtils.storeData(el, "drag-handle", handle);
    handle.addEventListener("mousedown", handleStart);
    handle.addEventListener("touchstart", handleStart, { passive: !config.preventDefault });
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", handleMove, { passive: !config.preventDefault });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
    handle.style.cursor = config.cursor ?? "move";
    this.log(`Drag directive mounted on element`, el);
  }
  updated(el, binding) {
    this.cleanup(el);
    this.mounted(el, binding);
    this.log(`Drag directive updated on element`, el);
  }
  unmounted(el) {
    this.cleanup(el);
    this.log(`Drag directive unmounted from element`, el);
  }
  cleanup(el) {
    const handlers = directiveUtils.getData(el, "drag-handlers");
    const handle = directiveUtils.getData(el, "drag-handle");
    const state = directiveUtils.getData(el, "drag-state");
    if (state && state.isDragging) {
      state.isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (el) {
        el.style.cursor = "";
      }
    }
    if (handlers && handle) {
      handle.removeEventListener("mousedown", handlers.handleStart);
      handle.removeEventListener("touchstart", handlers.handleStart);
      document.removeEventListener("mousemove", handlers.handleMove);
      document.removeEventListener("touchmove", handlers.handleMove);
      document.removeEventListener("mouseup", handlers.handleEnd);
      document.removeEventListener("touchend", handlers.handleEnd);
    }
    directiveUtils.removeData(el, "drag-handlers");
    directiveUtils.removeData(el, "drag-state");
    directiveUtils.removeData(el, "drag-handle");
    if (el && typeof el === "object") {
      el.__dragState = null;
      el.__dragHandlers = null;
    }
  }
  getHandle(el, handle) {
    if (!handle) {
      return el;
    }
    if (typeof handle === "string") {
      const handleEl = el.querySelector(handle);
      return handleEl || el;
    }
    return handle;
  }
  getEventPoint(e) {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }
  getConstraintBounds(el, constraint) {
    let minX = constraint.minX ?? -Infinity;
    let maxX = constraint.maxX ?? Infinity;
    let minY = constraint.minY ?? -Infinity;
    let maxY = constraint.maxY ?? Infinity;
    if (constraint.parent && el.parentElement) {
      const parent = el.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      minX = 0;
      maxX = parentRect.width - elRect.width;
      minY = 0;
      maxY = parentRect.height - elRect.height;
    }
    if (constraint.selector) {
      const container = document.querySelector(constraint.selector);
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        minX = containerRect.left - elRect.left;
        maxX = containerRect.right - elRect.right;
        minY = containerRect.top - elRect.top;
        maxY = containerRect.bottom - elRect.bottom;
      }
    }
    return { minX, maxX, minY, maxY };
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "boolean") {
      return { disabled: !value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return {};
  }
  getExample() {
    return `
<!-- Basic draggable element -->
<div v-drag class="draggable-box">
  Drag me!
</div>

<!-- Axis constraint -->
<div v-drag="{ axis: 'x' }" class="slider">
  Horizontal only
</div>

<div v-drag="{ axis: 'y' }" class="slider">
  Vertical only
</div>

<!-- With handle -->
<div v-drag="{ handle: '.handle' }" class="panel">
  <div class="handle">\u22EE\u22EE Drag Handle</div>
  <div class="content">Panel content</div>
</div>

<!-- Boundary constraints -->
<div v-drag="{
  constraint: {
    parent: true
  }
}" class="bounded-box">
  Constrained to parent
</div>

<!-- With callbacks -->
<div v-drag="{
  onStart: (e) => ,
  onMove: (e) => updatePosition(e),
  onEnd: (e) => savePosition(e)
}" class="tracked-box">
  Tracked dragging
</div>

<!-- Custom constraints -->
<div v-drag="{
  constraint: {
    minX: 0,
    maxX: 500,
    minY: 0,
    maxY: 300
  }
}" class="limited-box">
  Limited range
</div>

<style>
.draggable-box {
  width: 100px;
  height: 100px;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.handle {
  background: #2c3e50;
  color: white;
  padding: 8px;
  cursor: move;
}
</style>
    `;
  }
}
const vDrag = defineDirective(new DragDirective());

export { DragDirective, vDrag as default, vDrag };
//# sourceMappingURL=drag.js.map
