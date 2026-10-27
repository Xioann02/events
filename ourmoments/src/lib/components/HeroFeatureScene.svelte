<script>
  import { onMount } from 'svelte'
  import * as THREE from 'three'

  let canvas

  function makeFeatureTexture(type) {
    const surface = document.createElement('canvas')
    surface.width = 600
    surface.height = 840
    const context = surface.getContext('2d')
    const ink = '#201e1c'
    const muted = '#77716a'
    const accent = '#873b43'
    const paper = '#f6f3ed'

    context.fillStyle = paper
    context.fillRect(0, 0, 600, 840)
    context.fillStyle = muted
    context.font = '500 16px Arial, sans-serif'
    context.letterSpacing = '3px'
    context.fillText(type === 'invite' ? 'A GATHERING' : `OUR MOMENTS / ${type.toUpperCase()}`, 54, 72)
    context.strokeStyle = '#d7d1c7'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(54, 102)
    context.lineTo(546, 102)
    context.stroke()

    if (type === 'invite') {
      context.fillStyle = accent
      context.beginPath()
      context.arc(300, 184, 12, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = ink
      context.textAlign = 'center'
      context.font = 'italic 400 74px Georgia, serif'
      context.fillText('You are', 300, 324)
      context.fillText('invited', 300, 408)
      context.font = '400 20px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillStyle = muted
      context.fillText('A MOMENT TO CELEBRATE', 300, 480)
      context.strokeStyle = '#b7a99a'
      context.beginPath()
      context.moveTo(212, 532)
      context.lineTo(388, 532)
      context.stroke()
      context.font = '500 16px Arial, sans-serif'
      context.fillText('SATURDAY · 18:30', 300, 582)
      context.fillText('SAVE THE DATE', 300, 618)
      context.textAlign = 'left'
    }

    if (type === 'rsvp') {
      context.fillStyle = ink
      context.font = 'italic 400 62px Georgia, serif'
      context.fillText('Join us?', 54, 208)
      context.fillStyle = muted
      context.font = '400 20px Arial, sans-serif'
      context.fillText('Please reply by 01 October', 54, 254)
      ;[['01', 'Joyfully accepts'], ['02', 'Regretfully declines'], ['03', 'Dietary notes']].forEach(([number, label], index) => {
        const y = 344 + index * 108
        context.strokeStyle = '#d7d1c7'
        context.beginPath()
        context.moveTo(54, y - 28)
        context.lineTo(546, y - 28)
        context.stroke()
        context.fillStyle = accent
        context.font = '500 16px Arial, sans-serif'
        context.fillText(number, 54, y + 14)
        context.fillStyle = ink
        context.font = '400 23px Arial, sans-serif'
        context.fillText(label, 100, y + 14)
        context.beginPath()
        context.arc(520, y + 6, 12, 0, Math.PI * 2)
        context.stroke()
      })
      context.fillStyle = ink
      context.beginPath()
      context.roundRect(54, 700, 492, 66, 6)
      context.fill()
      context.fillStyle = paper
      context.textAlign = 'center'
      context.font = '500 17px Arial, sans-serif'
      context.fillText('SEND RESPONSE', 300, 742)
      context.textAlign = 'left'
    }

    if (type === 'calendar') {
      context.fillStyle = muted
      context.font = '500 17px Arial, sans-serif'
      context.fillText('OCTOBER 2026', 54, 190)
      context.fillStyle = ink
      context.font = 'italic 400 54px Georgia, serif'
      context.fillText('A date to keep', 54, 270)
      context.font = '500 17px Arial, sans-serif'
      context.fillStyle = muted
      ;['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((day, index) => context.fillText(day, 69 + index * 70, 368))
      for (let day = 1; day <= 31; day += 1) {
        const index = day + 2
        const x = 70 + (index % 7) * 70
        const y = 430 + Math.floor(index / 7) * 76
        context.fillStyle = day === 18 ? paper : ink
        if (day === 18) {
          context.fillStyle = accent
          context.beginPath()
          context.arc(x - 5, y - 7, 24, 0, Math.PI * 2)
          context.fill()
          context.fillStyle = paper
        }
        context.textAlign = 'center'
        context.font = '400 20px Arial, sans-serif'
        context.fillText(String(day), x - 5, y)
      }
      context.textAlign = 'left'
      context.fillStyle = ink
      context.beginPath()
      context.roundRect(54, 700, 492, 66, 6)
      context.fill()
      context.fillStyle = paper
      context.textAlign = 'center'
      context.font = '500 17px Arial, sans-serif'
      context.fillText('ADD TO CALENDAR', 300, 742)
      context.textAlign = 'left'
    }

    if (type === 'gallery') {
      context.fillStyle = ink
      context.font = 'italic 400 60px Georgia, serif'
      context.fillText('Shared', 54, 210)
      context.fillText('moments', 54, 278)
      const colors = [
        ['#c5b9aa', '#ded8ce', '#a8a195'],
        ['#e3d6c9', '#b68c7c', '#d2c7ba'],
        ['#85847c', '#c4b8aa', '#e7dfd4'],
        ['#b5a28f', '#e2d9ce', '#87786d'],
      ]
      colors.forEach((swatch, index) => {
        const x = 54 + (index % 2) * 252
        const y = 344 + Math.floor(index / 2) * 180
        context.fillStyle = swatch[0]
        context.beginPath()
        context.roundRect(x, y, 234, 162, 5)
        context.fill()
        context.fillStyle = swatch[1]
        context.beginPath()
        context.arc(x + 154, y + 52, 48, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = swatch[2]
        context.beginPath()
        context.moveTo(x, y + 150)
        context.lineTo(x + 94, y + 60)
        context.lineTo(x + 180, y + 150)
        context.closePath()
        context.fill()
      })
      context.fillStyle = muted
      context.font = '500 16px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillText('GUEST PHOTO ALBUM', 54, 760)
    }

    const texture = new THREE.CanvasTexture(surface)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return texture
  }

  onMount(() => {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.z = 8.5
    scene.add(new THREE.AmbientLight(0xffffff, 2.2))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(-4, 6, 8)
    scene.add(keyLight)

    const specs = [
      { type: 'calendar', x: -1.95, y: 1.0, z: -0.5, scale: 0.65, rotateY: 0.18, rotateZ: -0.14 },
      { type: 'gallery', x: 2.0, y: 1.0, z: -0.3, scale: 0.65, rotateY: -0.17, rotateZ: 0.12 },
      { type: 'invite', x: -0.18, y: 0.05, z: 0.42, scale: 0.86, rotateY: -0.1, rotateZ: -0.055 },
      { type: 'rsvp', x: 1.45, y: -1.35, z: 1.05, scale: 0.56, rotateY: -0.18, rotateZ: -0.09 },
    ]

    const panels = specs.map((spec, index) => {
      const group = new THREE.Group()
      const width = 2.28
      const height = 3.19
      const bodyGeometry = new THREE.BoxGeometry(width, height, 0.12)
      const body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: '#e9e4dc', roughness: 0.82 }))
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(width - 0.08, height - 0.08),
        new THREE.MeshBasicMaterial({ map: makeFeatureTexture(spec.type), toneMapped: false }),
      )
      face.position.z = 0.07
      group.add(body, face)
      group.position.set(spec.x, spec.y, spec.z)
      group.rotation.set(-0.035, spec.rotateY, spec.rotateZ)
      group.scale.setScalar(spec.scale)
      scene.add(group)
      return { group, spec, phase: index * 1.35 }
    })

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.position.z = width < 520 ? 10.4 : 8.5
      scene.position.x = width < 760 ? 0 : 2.1
      camera.updateProjectionMatrix()
    })
    observer.observe(canvas.parentElement)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const clock = new THREE.Clock()
    let frameId
    function render() {
      const elapsed = clock.getElapsedTime()
      if (!reducedMotion) {
        panels.forEach(({ group, spec, phase }) => {
          group.position.y = spec.y + Math.sin(elapsed * 0.55 + phase) * 0.055
          group.rotation.z = spec.rotateZ + Math.sin(elapsed * 0.38 + phase) * 0.012
        })
      }
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(render)
    }
    render()

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      scene.traverse((object) => {
        if (!object.isMesh) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          material.map?.dispose()
          material.dispose()
        })
      })
      renderer.dispose()
    }
  })
</script>

<div class="hero-feature-scene" role="img" aria-label="Three-dimensional invitation, RSVP, calendar, and shared photo gallery panels">
  <canvas bind:this={canvas}></canvas>
</div>