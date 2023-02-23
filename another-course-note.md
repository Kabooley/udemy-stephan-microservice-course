## Initial Scaffolding

ADD `./src/state/`
ADD `./src/state/index.ts`
ADD `./src/state/store.ts`
ADD `./src/state/actions/index.ts`
ADD `./src/state/action-creators/index.ts`
ADD `./src/state/actions-types/index.ts`
ADD `./src/state/reducers/bundleReducers.ts`
ADD `./src/state/reducers/cellsReducers.ts`
ADD `./src/state/reducers/index.ts`

今後何かエラーが発生したらサーバをリスタートさせてねとのこと

```TypeScript
// action-types/index.ts

export enum ActionType {
    MOVE_CELL = 'move_cell',
    DELETE_CELL = 'delete_cell',
    INSERT_CELL_BEFORE = 'insert_cell_before',
    UDPATE_CELL = 'update_cell',
};
```

## [Miximillian Course] Diving into Redux

Redux も React Context も両方`Cross-Component state`,`App-Wide state`を実現することができる仕組みである

どうして react context をすでに利用しているのに react redux を使わないといけないんだい？

(Miximillian の section10 で扱われた)

react context にはいくつかの潜在的な短所が存在する

その短所がアプリケーションに影響しないならば context を、

影響するならば redux を使おうという判断でいいのではと

#### Disadvantages of React Context

（どちらかが優れているという話ではなく）React Context で遭遇しうるデメリットについてまとめる

- セットアップ・管理が複雑である：大きなアプリケーションには向いていないことになる。規模が小さいアプリケーションならば問題ないだろう。
  低頻度の更新には向いているけれど、頻繁に更新されるデータを管理するのには向いていない
- パフォーマンス：低頻度に更新されるデータの管理には向いているものの高頻度の更新が必要なデータには向いていないと公式が回答しているとのこと
-

# Section 18

Redux を React に統合します

```bash
$ cd jbook/src/components
$ touch cell-list.tsx cell-list-item.tsx
```

それぞれセルの一覧と、セル自身をラップするコンポーネントである

ひとまず骨組みを作る

```TypeScript
// cell-list.tsx
const CellList: React.FC<> = () => {
  return <div></div>
};

export default CellList;

// cell-list-item.tsx
const CellListItem: React.FC<> = () => {
  return <div></div>
};

export default CellListItem;
```

```TypeScript
// index.tsx
import { CellList } from './components/cell-list'

const App = () => {
  return (
    <Provider store={store}>
      <div>
        // <TextEditor />
        <CellList />
      </div>
    </Provider>
  );
};
```

#### Redux: type selector を使う

```bash
$ cd jbook/src/
$ mkdir bundler/ hooks/
$ touch hooks/use-typed-selector.ts
```

```TypeScript
// use-typed-selectors.ts

import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState } from '../state';

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## [自習] `TypedUseSelectorHook`

_TypeScript で型付けした情報を Redux でもカンタンに利用するための仕組みらしい_

https://react-redux.js.org/using-react-redux/usage-with-typescript

Redux が管理する state の型情報やディスパッチするアクションの型情報をカンタンに参照するための仕組み。

1. まずは`RootState`と`Dispatch Types`を定義する。

```TypeScript
import { configureStore } from '@reduxjs/toolkit'
// ...

const store = configureStore({
  reducer: {
    posts: postsReducer,
    comments: commentsReducer,
    users: usersReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
```

2. `useDispatch`と`useSelector`を作成する

`useSelector(TypedUseSelectorHook)`とは？:

NOTE: わからん！Redux のチュートリアルやろうか、この際。

# マキシミリアンの方のコースのノートの続き

つまり redux で state の更新があったときに、その更新内容に対して

useSeect を使っているコンポーネントが反応するため、

コンポーネントは常に最新の redux の state データを読み取ることができるうえ、

更新がなければ再レンダリングも起こさない。

https://redux.js.org/tutorials/fundamentals/part-5-ui-react#reading-state-from-the-store-with-useselector

より：

> 幸い、useSelector は自動的に Redux ストアにサブスクライブしてくれるのです。そうすれば、アクションがディスパッチされるたびに、そのセレクタ関数がすぐに再び呼び出されます。もしセレクタが返す値が前回実行したときと変わっていれば、useSelector は新しいデータでコンポーネントを強制的に再レンダリングします。私たちがすべきことは、コンポーネント内で useSelector() を一度呼び出すだけで、あとはこの関数が私たちに代わって処理してくれます。（注意も読んでおこう）

まとめると、

`useSelector()`は React コンポーネントから Redux の state を読み取る手段であるということでした。

## `React-Redux`の公式ファンダメンタルズ

https://redux.js.org/tutorials/fundamentals/part-5-ui-react#reading-state-from-the-store-with-useselector

#### `useDispatch`

https://redux.js.org/tutorials/fundamentals/part-5-ui-react#dispatching-actions-with-usedispatch

ということでこっちは、

React コンポーネントから Redux ストアへアクションをディスパッチする手段である。

`store.dispatch(action)`は React 以外でならば利用できたのだけど...とかいてある。そうだっけ？

hooks の`useDispatch()`は内部的に`state.dispatch()`を呼び出しているので結果同じことであるが。

使い方：

- useDispatch()で返されたオブジェクトが、React コンポーネントの中からディスパッチすることができる。

```JavaScript
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

const Header = () => {
  const [text, setText] = useState('')
  const dispatch = useDispatch()

  const handleChange = e => setText(e.target.value)

  const handleKeyDown = e => {
    const trimmedText = e.target.value.trim()
    // If the user pressed the Enter key:
    if (e.key === 'Enter' && trimmedText) {
      // Dispatch the "todo added" action with this text
      dispatch({ type: 'todos/todoAdded', payload: trimmedText })
      // And clear out the text input
      setText('')
    }
  }

  return (
    <input
      type="text"
      placeholder="What needs to be done?"
      autoFocus={true}
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}

export default Header
```
