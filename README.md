# ReactでChrome拡張機能をビルドする方法を模索する

エンジニアの皆さんなら一度は作ったことがあるはずのChrome拡張機能でもっと高度で複雑なアプリを作りたい。  

## 背景

Chrome拡張機能は`Javascript`のみで作成することが可能(必要に応じて`HTML`, `CSS`)でブラウザにちょっとした機能をつけることができます。  
そしてデプロイも五百円でかつ容易なため成果の見えやすいものになります。  

- 拡張機能を作り上げるにはDOMの概念や比較的高度なJavscriptの操作が要求される
- デプロイが非常に容易で安価

以上のことから成果物の可視化がしやすくプログラミング初学者の学習に最適だと感じています。  

一方で、Chrome拡張機能を開発する上では拡張機能独自の機能を利用したり、制限の中で開発する必要があるほか、Javascriptを用いてDOMを操作する必要が生じるため、一朝一夕にはうまくいかないものです。  

特に現在閲覧しているWebページに対して拡張機能を通して`別の表示をする`場合などにはDOM自体を正確に制御する必要がありそれがなかなか難しいものです。  

そこでReactやVueなどの仮想DOMを用いることで非常に簡単に操作してみたいと考えます。  

## Reactアプリの導入

まず任意のディレクトリを作成して、Reactアプリを生成します。  
Reactのアプリは`npx`を用いて簡単にテンプレートの生成を行うことが可能です。  

```bash  
npx create-react-app extension_app  
```  

生成された`extension_app`ディレクトリに移動し、Reactアプリをビルドします。  

```  
yarn build (or npm run build)  
```  

すると`build`ディレクトリが生成されるので、`build/index.html`をブラウザで開きます。  
するとReactのページが表示されうまくビルドが完了しているかと思います。  

## 拡張機能への第一歩

Chrome拡張機能を開発する上でもっとも重要になるのが`manifest.json`の存在です。  
拡張機能の役割や詳細な情報は`manifest.json`によりブラウザに認識させ、ブラウザは拡張機能としてパッケージを読み込みます。  

`public/manifest.json`を以下のように編集してみます。  

```  
{
  "manifest_version": 2,  
  "name": "React Chrome Extension",  
  "version": "0.0.1",  
  "browser_action": {  
    "default_icon": "logo192.png",  
    "default_popup": "index.html"  
  },  
  "content_security_policy": "script-src 'self' 'sha256-GgRxrVOKNdB4LrRsVPDSbzvfdV4UqglmviH9GoBJ5jk='; object-src 'self'"  
}
```  

そして再び`yarn build`とすれば良いのですが、Reactアプリのデフォルトでは、実行中に小さなランタイムスクリプトを`index.html`に埋め込みます。  
これはHTTPリクエストの数を減らすためなのですが、Chrome拡張機能ではCSPに違反するためエラーが生じてしまします。  
これを回避するためにビルド時の設定を変更します。  
そして、`packege.json`のscriptsに次のように記述を変更します  

```json  
 // "build": "react-scripts build",  
"build": "INLINE_RUNTIME_CHUNK=false react-scripts build"  
```  

これができたら`yarn build`として生成した`build`をChrome拡張機能に読み込ませます。  
表示されたアイコンをクリックするとreactのアプリが表示されるはずです！  
これで拡張機能の`popup`をReactを使って作ることができました。  


## Webサイト上でReactを動かす

Chrome拡張機能では閲覧しているWebサイト自体を操作したり、新たにパネルを表示させたりすることも可能です。  
しかしここで問題になるのが、先ほどビルドしたReactアプリは`index.html`をエントリーポイントとして、それ以外のJSファイルはビルドするたびにファイルめいが変更されることです。  

`index.html`だと基本的に`popup page`のみでしか動作しない上、毎回ファイルの名前を`manifest.json`に記述する必要が出るからです。  
これは`create-react-app`を用いてReactアプリを生成しているためwebpackのセットも内蔵されており変更することはできません。  

この回避策として、`yarn run eject`を用いる方法があります。  
`yarn run eject`を用いることで`create-react-app`の管理から抜け出してnode_modules以下に必要なモジュールが全てインストールされ、単独でビルド可能になります。  

### Reactのビルド設定を変更する

まず、gitでcommitしてから`yarn run eject`を実行し`yarn install`を実行  
すると`/build`が生成されてちゃんとビルドされているはず。  

`yarn run eject`を実行した際に`/config`と`/scripts`のフォルダにそれぞれJSファイルがいくつか生成されていると思います。  
このこの中の`/config/webpack.config.js`を開いて該当部分を編集します。

```javascript
// These are the "entry points" to our application.
// This means they will be the "root" imports that are included in JS bundle.
entry: { // このentryオブジェクトの中身を変更する
  main: [paths.appIndexJs],
  content: ['./src/content.js']
},
/** 中略 */
// ここで Runtimeを
runtimeChunk: false // オブジェクトをfalseに変更
```

> [Make extension compatible with Create React App v2.x · Issue #2 · satendra02/react-chrome-extension · GitHub](https://github.com/satendra02/react-chrome-extension/issues/2#issuecomment-559533252)

webpackはデフォルトでビルドする際に出力するファイル名にハッシュ(リビジョン)を付与します。  
これはファイル名をビルドするごとに変化させることで、ブラウザがキャッシュを読み込んで変更が反映されない問題を回避するためだそうです。
> [webpack@4 で出力するファイルをリビジョン管理する](https://numb86-tech.hatenablog.com/entry/2018/11/03/122201)

Chrome拡張機能では`content_script page`や`background page`などそれぞれのページで読み込むファイルを`manifest.json`で定義する必要があります。
ビルドするたびにファイル名が変更される状態では毎回`manifest.json`を書き換える必要が生じてかなりの手間になります。

そこでハッシュが付与されないように`config/webpack.config.js`内の`.[contenthash:8]`や`.[hash:8]`を検索して削除します。


```javascript
  // Example....

  //  'static/js/[name].[contenthash:8].js'
  'static/js/[name].js'
  // 中略 
  {
    // name: 'static/media/[name].[hash:8].[ext]'
    name: 'static/media/[name].[ext]'
  }
```

こうすることで、ハッシュが付与されなくなるので、ビルドしたら直ぐにChrome拡張機能に変更を反映することができます。

さらにここでビルドするために`.env`ファイルをルートディレクトリに作成して以下のように書き加えます。

```bash
# /.env
NODE_ENV=development
PUBLIC_URL=./ # こう指定することでリソースを読み込む際に絶対パスにならないようにしている
```

そして`yarn build`を実行します。


 
> 参考文献  
> `/config/webpack.config.js`あたりの話で参考になった  
>  [Create chrome extension with ReactJs using inject page strategy](https://itnext.io/create-chrome-extension-with-reactjs-using-inject-page-strategy-137650de1f39)  
> [Make extension compatible with Create React App v2.x · Issue #2 · satendra02/react-chrome-extension · GitHub](https://github.com/satendra02/react-chrome-extension/issues/2#issuecomment-559533252)