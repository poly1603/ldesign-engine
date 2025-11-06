import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationComponent } from './components/navigation.component'
import { RouterViewComponent } from './components/router-view.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    RouterViewComponent,
  ],
  template: `
    <div class="app">
      <header class="header">
        <h1>🚀 Angular + LDesign Engine + Router</h1>
        <p>这是一个使用 &#64;ldesign/engine-angular 和路由系统构建的示例项目</p>
      </header>

      <!-- 导航栏 -->
      <app-navigation />

      <main class="main">
        <!-- 路由视图 -->
        <app-router-view />
      </main>

      <footer class="footer">
        <p>Powered by &#64;ldesign/engine-angular + &#64;ldesign/router</p>
      </footer>
    </div>
  `,
  styles: [`
    .app {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      color: #666;
      font-size: 1.1rem;
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .feature {
      padding: 1.5rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #dd003115 0%, #c3002f15 100%);
      border: 1px solid #dd003130;
    }

    .feature h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .feature p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      color: #999;
    }
  `],
})
export class AppComponent {}

