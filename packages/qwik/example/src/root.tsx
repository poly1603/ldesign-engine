/**
 * Qwik Root 组件
 * Qwik 需要的根组件入口
 */
import { component$ } from '@builder.io/qwik'
import App from './App'

export default component$(() => {
  return (
    <>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Qwik Engine Example</title>
      </head>
      <body>
        <App />
      </body>
    </>
  )
})





