# frozen_string_literal: true
# The SVG renderer projects real three-dimensional category meshes.
node = ENV.fetch('NODE', 'node')
abort 'Category mesh rendering failed' unless system(node, File.join(__dir__, 'build_mesh_art.mjs'))
