/**
 * Counter Component Example
 * 
 * 展示 EngineStateService 的使用
 */

import { Component, OnInit } from '@angular/core'
import { EngineStateService } from '@ldesign/engine-angular'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <h2>计数器示例</h2>
      <div class="counter-value">{{ count$ | async }}</div>
      <div class="counter-buttons">
        <button (click)="decrement()">-1</button>
        <button (click)="reset()">重置</button>
        <button (click)="increment()">+1</button>
      </div>
    </div>
  `,
  styles: [`
    .counter {
      padding: 2rem;
      text-align: center;
    }
    .counter-value {
      font-size: 3rem;
      font-weight: bold;
      color: #dd0031;
      margin: 1rem 0;
    }
    .counter-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      background-color: #dd0031;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background-color: #c3002f;
    }
  `]
})
export class CounterComponent implements OnInit {
  count$!: Observable<number | undefined>
  private setCount!: (value: number | ((prev: number | undefined) => number)) => void

  constructor(private stateService: EngineStateService) { }

  ngOnInit() {
    const [count$, setCount] = this.stateService.createState<number>('count', 0)
    this.count$ = count$
    this.setCount = setCount
  }

  increment() {
    this.setCount(prev => (prev || 0) + 1)
  }

  decrement() {
    this.setCount(prev => (prev || 0) - 1)
  }

  reset() {
    this.setCount(0)
  }
}


