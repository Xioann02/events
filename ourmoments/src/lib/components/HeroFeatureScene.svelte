<script>
  import { onMount } from 'svelte'
  import * as THREE from 'three'

  let canvas

  function roundedPanelShape(width, height, radius) {
    const shape = new THREE.Shape()
    const left = -width / 2
    const right = width / 2
    const bottom = -height / 2
    const top = height / 2

    shape.moveTo(left + radius, bottom)
    shape.lineTo(right - radius, bottom)
    shape.quadraticCurveTo(right, bottom, right, bottom + radius)
    shape.lineTo(right, top - radius)
    shape.quadraticCurveTo(right, top, right - radius, top)
    shape.lineTo(left + radius, top)
    shape.quadraticCurveTo(left, top, left, top - radius)
    shape.lineTo(left, bottom + radius)
    shape.quadraticCurveTo(left, bottom, left + radius, bottom)
    return shape
  }

  function makeFeatureTexture(type) {
    const surface = document.createElement('canvas')
    surface.width = 600
    surface.height = 840
    const context = surface.getContext('2d')
    const papers = {
      invite: '#f5f1e9',
      rsvp: '#f0ece5',
      calendar: '#f2eee6',
      guestlist: '#eeebe5',
      seating: '#f3efe8',
      qr: '#edeae4',
      gallery: '#f1ede6',
    }
    const ink = '#27231f'
    const muted = '#756f67'
    const accent = '#79363e'
    const paper = papers[type] ?? papers.invite
    const sectionLabels = { guestlist: 'GUESTS', seating: 'SEATING', qr: 'SHARE', gallery: 'PHOTOS' }

    context.fillStyle = paper
    context.fillRect(0, 0, 600, 840)
    context.fillStyle = muted
    context.font = '500 16px Arial, sans-serif'
    context.letterSpacing = '3px'
    context.fillText(type === 'invite' ? 'PRIVATE INVITATION' : `OUR MOMENTS / ${sectionLabels[type] ?? type.toUpperCase()}`, 54, 72)
    context.strokeStyle = '#d7d1c7'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(54, 102)
    context.lineTo(546, 102)
    context.stroke()

    if (type === 'invite') {
      context.strokeStyle = '#cbb9a8'
      context.lineWidth = 2
      context.strokeRect(34, 34, 532, 772)
      context.fillStyle = ink
      context.textAlign = 'center'
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '3px'
      context.fillStyle = muted
      context.fillText('TOGETHER WITH THEIR FAMILIES', 300, 168)
      context.fillStyle = accent
      context.font = 'italic 400 42px Georgia, serif'
      context.letterSpacing = '0px'
      context.fillText('You are invited', 300, 238)
      context.fillStyle = ink
      context.font = 'italic 400 68px Georgia, serif'
      context.fillText('Sofia', 300, 342)
      context.font = 'italic 400 33px Georgia, serif'
      context.fillText('&', 300, 390)
      context.font = 'italic 400 68px Georgia, serif'
      context.fillText('James', 300, 472)
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillStyle = muted
      context.fillText('REQUEST THE PLEASURE OF YOUR COMPANY', 300, 536)
      context.strokeStyle = '#b7a99a'
      context.beginPath()
      context.moveTo(220, 580)
      context.lineTo(380, 580)
      context.stroke()
      context.fillStyle = ink
      context.font = '600 17px Arial, sans-serif'
      context.fillText('SATURDAY · 18 OCTOBER · 18:30', 300, 632)
      context.fillStyle = muted
      context.font = '500 15px Arial, sans-serif'
      context.fillText('THE GLASSHOUSE · NICOSIA', 300, 674)
      context.textAlign = 'left'
    }

    if (type === 'rsvp') {
      context.fillStyle = ink
      context.font = 'italic 400 62px Georgia, serif'
      context.fillText('RSVP', 54, 208)
      context.fillStyle = muted
      context.font = '400 20px Arial, sans-serif'
      context.fillText('Will you join us? Reply by 01 October', 54, 254)
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

    if (type === 'guestlist') {
      context.fillStyle = ink
      context.font = 'italic 400 56px Georgia, serif'
      context.fillText('Guest list', 54, 190)
      context.fillStyle = muted
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillText('84 PEOPLE · 61 CONFIRMED', 54, 238)

      ;[['EM', 'Elena Marin', 'YES'], ['MC', 'Marcus Cole', 'YES'], ['AH', 'Amelia Hart', 'WAITING']].forEach(([initials, name, status], index) => {
        const y = 320 + index * 86
        context.strokeStyle = '#d5d0c7'
        context.beginPath()
        context.moveTo(54, y + 34)
        context.lineTo(546, y + 34)
        context.stroke()
        context.fillStyle = '#ded9d0'
        context.beginPath()
        context.arc(76, y - 2, 22, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = ink
        context.textAlign = 'center'
        context.font = '600 11px Arial, sans-serif'
        context.fillText(initials, 76, y + 2)
        context.textAlign = 'left'
        context.font = '500 19px Arial, sans-serif'
        context.fillText(name, 118, y + 3)
        context.fillStyle = status === 'YES' ? accent : muted
        context.textAlign = 'right'
        context.font = '600 12px Arial, sans-serif'
        context.fillText(status, 546, y + 2)
        context.textAlign = 'left'
      })
      context.fillStyle = ink
      context.beginPath()
      context.roundRect(54, 700, 492, 62, 5)
      context.fill()
      context.fillStyle = paper
      context.textAlign = 'center'
      context.font = '600 15px Arial, sans-serif'
      context.fillText('MANAGE GUESTS', 300, 739)
      context.textAlign = 'left'
    }

    if (type === 'seating') {
      context.fillStyle = ink
      context.font = 'italic 400 54px Georgia, serif'
      context.fillText('Table seating', 54, 190)
      context.fillStyle = muted
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillText('6 TABLES · 48 SEATS ASSIGNED', 54, 238)
      context.strokeStyle = accent
      context.lineWidth = 2
      ;[{ x: 190, y: 430, label: '04', occupied: 6 }, { x: 410, y: 590, label: '05', occupied: 5 }].forEach((table) => {
        context.beginPath()
        context.arc(table.x, table.y, 66, 0, Math.PI * 2)
        context.stroke()
        for (let seat = 0; seat < 8; seat += 1) {
          const angle = (Math.PI * 2 * seat) / 8
          context.fillStyle = seat < table.occupied ? accent : '#c8c2b9'
          context.beginPath()
          context.arc(table.x + Math.cos(angle) * 94, table.y + Math.sin(angle) * 94, 11, 0, Math.PI * 2)
          context.fill()
        }
        context.fillStyle = ink
        context.textAlign = 'center'
        context.font = 'italic 400 34px Georgia, serif'
        context.fillText(table.label, table.x, table.y + 10)
      })
      context.textAlign = 'left'
      context.fillStyle = muted
      context.font = '500 13px Arial, sans-serif'
      context.fillText('DRAG · PLACE · REARRANGE', 54, 760)
    }

    if (type === 'qr') {
      context.fillStyle = ink
      context.font = 'italic 400 56px Georgia, serif'
      context.fillText('Share the day', 54, 190)
      context.fillStyle = muted
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillText('ONE CODE FOR EVERY GUEST', 54, 238)
      const qrX = 140
      const qrY = 310
      const qrCell = 29
      context.fillStyle = '#faf8f3'
      context.fillRect(qrX - 24, qrY - 24, 367, 367)
      context.fillStyle = ink
      for (let row = 0; row < 11; row += 1) {
        for (let column = 0; column < 11; column += 1) {
          const finder = (row < 3 && column < 3) || (row < 3 && column > 7) || (row > 7 && column < 3)
          const mark = finder || ((row * 3 + column * 5 + row * column) % 7 < 3)
          if (mark) context.fillRect(qrX + column * qrCell, qrY + row * qrCell, qrCell - 5, qrCell - 5)
        }
      }
      context.fillStyle = accent
      context.textAlign = 'center'
      context.font = '600 14px Arial, sans-serif'
      context.fillText('SCAN TO OPEN THE INVITATION', 300, 730)
      context.fillStyle = muted
      context.font = '500 13px Arial, sans-serif'
      context.fillText('ourmoments.io/sofia-james', 300, 768)
      context.textAlign = 'left'
    }

    if (type === 'gallery') {
      context.fillStyle = ink
      context.font = 'italic 400 56px Georgia, serif'
      context.fillText('Shared moments', 54, 190)
      context.fillStyle = muted
      context.font = '500 15px Arial, sans-serif'
      context.letterSpacing = '2px'
      context.fillText('GUEST PHOTO GALLERY', 54, 238)
      const photoTones = [
        ['#bdb5aa', '#dbd5cc', '#8e887f'],
        ['#d5cec4', '#a79d92', '#c4bcb2'],
        ['#96928b', '#c8c1b8', '#e2ddd5'],
        ['#c4b9ad', '#e0dad1', '#938a81'],
      ]
      photoTones.forEach((tones, index) => {
        const x = 54 + (index % 2) * 252
        const y = 292 + Math.floor(index / 2) * 188
        context.fillStyle = tones[0]
        context.beginPath()
        context.roundRect(x, y, 234, 166, 4)
        context.fill()
        context.fillStyle = tones[1]
        context.beginPath()
        context.arc(x + 162, y + 52, 46, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = tones[2]
        context.beginPath()
        context.moveTo(x, y + 152)
        context.lineTo(x + 90, y + 72)
        context.lineTo(x + 182, y + 152)
        context.closePath()
        context.fill()
      })
      context.fillStyle = ink
      context.beginPath()
      context.roundRect(54, 700, 492, 62, 5)
      context.fill()
      context.fillStyle = paper
      context.textAlign = 'center'
      context.font = '600 15px Arial, sans-serif'
      context.fillText('+ UPLOAD PHOTOS', 300, 739)
      context.textAlign = 'left'
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
      // Temporarily hidden — keep this spec to restore the “A date to keep” card later.
      // { type: 'calendar', bodyColor: '#d9d3ca', x: -2.28, y: 1.35, z: -1.15, scale: 0.48, rotateY: 0.2, rotateZ: -0.12 },
      { type: 'gallery', bodyColor: '#d8d2c9', x: 2.3, y: 1.42, z: -1.02, scale: 0.5, rotateY: -0.18, rotateZ: 0.1 },
      { type: 'guestlist', bodyColor: '#d7d2ca', x: -1.72, y: -0.72, z: -0.62, scale: 0.49, rotateY: 0.16, rotateZ: 0.08 },
      { type: 'seating', bodyColor: '#dad4cb', x: 2.2, y: -0.3, z: -0.46, scale: 0.47, rotateY: -0.17, rotateZ: -0.06 },
      { type: 'qr', bodyColor: '#d5d0c8', x: 2.3, y: -1.7, z: 0.12, scale: 0.4, rotateY: -0.14, rotateZ: 0.08 },
      { type: 'invite', bodyColor: '#ddd6cc', x: -0.24, y: 0.04, z: 0.58, scale: 0.84, rotateY: -0.08, rotateZ: -0.035 },
      { type: 'rsvp', bodyColor: '#d8d1c8', x: 0.95, y: -1.58, z: 1.02, scale: 0.47, rotateY: -0.16, rotateZ: -0.07 },
    ]

    const panels = specs.map((spec, index) => {
      const group = new THREE.Group()
      const width = 2.28
      const height = 3.19
      const bodyGeometry = new THREE.ExtrudeGeometry(roundedPanelShape(width, height, 0.12), {
        depth: 0.1,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.025,
        bevelThickness: 0.02,
        curveSegments: 10,
      })
      const body = new THREE.Mesh(
        bodyGeometry,
        new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: 0.7, metalness: 0.015 }),
      )
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(width - 0.08, height - 0.08),
        new THREE.MeshBasicMaterial({ map: makeFeatureTexture(spec.type), toneMapped: false }),
      )
      face.position.z = 0.125
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

<div class="hero-feature-scene" role="img" aria-label="Three-dimensional invitation, RSVP, guest list, table seating, QR sharing, and guest photo upload panels">
  <canvas bind:this={canvas}></canvas>
</div>
