import Jimp from 'jimp'
import path from 'path'

jest.setTimeout(30000);

describe( 'test image hashing ', () => {

    const imagePath = path.join( '.', 'src', '__tests__' )

    test( 'print hash', () => {
        
        return Promise.all( [ 
            'img_p0_1',
            'img_p1_1',
            'img_p1_2',
            'img_p2_1',
            'img_p3_1',
            'img_p4_1',
            'img_p5_1',
            'img_p6_1']
            .map( n => Jimp.read( path.join(imagePath, `${n}.png`))
            .then( img => { return { name:n, value:img }}) ) )
            .then( images => 
                console.log( images.map( e => { return { ...e, value:e.value.hash() } } ) )
            )
    })

    test.skip( 'load different images (1)', () => {
        return Promise.all( [
            Jimp.read( path.join(imagePath, 'img_p2_1.png') ),
            Jimp.read( path.join(imagePath, 'img_p3_1.png') ),
        ])
        .then( images => { 
            const [img1, img2] = images 

            expect(img1).not.toBeNull() 
            expect(img2).not.toBeNull() 

            const h = [ img1.hash(), img2.hash() ]
            console.log( 'hash', h )

            expect(h[0]).toEqual(h[1])

            const dst = Jimp.distance(img1,img2)
            console.log( 'distance', dst )

            expect(dst).not.toEqual(0)
            
            const perc = Jimp.diff(img1,img2).percent
            console.log( 'percentage', perc )

            expect(perc).not.toEqual(0)

        })
    })

    test( 'load different images (2)', () => {
        return Promise.all( [
            Jimp.read( path.join(imagePath, 'img_p0_1.png') ),
            Jimp.read( path.join(imagePath, 'img_p6_1.png') ),
        ])
        .then( images => { 
            const [img1, img2] = images 

            expect(img1).not.toBeNull() 
            expect(img2).not.toBeNull() 

            const h = [ img1.hash(), img2.hash() ]
            console.log( 'hash', h )

            expect(h[0]).not.toEqual(h[1])

            const dst = Jimp.distance(img1,img2)
            console.log( 'distance', dst )

            expect(dst).not.toEqual(0)
            
            const perc = Jimp.diff(img1,img2).percent
            console.log( 'percentage', perc )

            expect(perc).not.toEqual(0)

        })
    })


    test( 'load same images', () => {
        return Promise.all( [
            Jimp.read( path.join(imagePath, 'img_p5_1.png') ),
            Jimp.read( path.join(imagePath, 'img_p5_1.png') ),
        ])
        .then( images => { 
            const [img1, img2] = images 

            expect(img1).not.toBeNull() 
            expect(img2).not.toBeNull() 

            const h = [ img1.hash(), img2.hash() ]
            console.log( 'hash', h )

            expect(h[0]).toEqual(h[1])

            const dst = Jimp.distance(img1,img2)
            console.log( 'distance', dst )

            expect(dst).toEqual(0)
            
            const perc = Jimp.diff(img1,img2).percent
            console.log( 'percentage', perc )

            expect(perc).toEqual(0)

        })
    
    })

})