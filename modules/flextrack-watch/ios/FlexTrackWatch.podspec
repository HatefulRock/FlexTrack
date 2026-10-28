Pod::Spec.new do |s|
  s.name           = 'FlexTrackWatch'
  s.version        = '1.0.0'
  s.summary        = 'Sends the FlexTrack watch snapshot to the paired Apple Watch'
  s.author         = 'FlexTrack'
  s.homepage       = 'https://github.com/HatefulRock/FlexTrack'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/HatefulRock/FlexTrack.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files   = '**/*.{h,m,swift}'
end
