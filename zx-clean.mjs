#!/usr/bin/env node
//
// ZX script
// @ref https://www.npmjs.com/package/zx
//

import 'zx/globals'

await fs.remove( 'bin' )
await fs.remove( 'dist' )
