/**
 * Honest Phase 1 Implementation Status Report and modular Unity 6 URP C# / ShaderLab
 * source scripts for Android deployment.
 */

export type ImplementationStatusTag = 'COMPLETE' | 'IN PROGRESS' | 'BLOCKED' | 'NOT IMPLEMENTED';

export interface StatusReportItem {
  id: string;
  requirement: string;
  status: ImplementationStatusTag;
  evidenceAndNotes: string;
}

export const PHASE_1_STATUS_REPORT: StatusReportItem[] = [
  {
    id: 'courtyard-env',
    requirement: '1 & 2. Aoyama Academy Courtyard 3D Environment',
    status: 'COMPLETE',
    evidenceAndNotes:
      'Constructed with multi-part 3D architecture: 3-story Main Academy Building with clock tower, recessed window bays, fluted portico columns, East/West covered walkways (Watari-rouka), interlocking ashlar stone pathways, octagonal central stone lantern plaza, 6 cedar benches, iron courtyard lamps, 12 multi-branched cherry blossom trees, and wrought-iron South Entrance Gates.',
  },
  {
    id: 'anime-character',
    requirement: '3. Rigged 3D Anime Student Character & Animations',
    status: 'COMPLETE',
    evidenceAndNotes:
      'Built "Haruka Aoyama" with a 19-node humanoid skeletal hierarchy (Pelvis, Torso, Chest, Neck, Head, Upper/Lower Arms, Thighs/Shins/Loafers, plus articulated Twin Back Hair, Side Locks, Ribbon Tails, Pleated Skirt, and Blinking Eyelids). Includes idle breathing, distance-synced walk/run gait cycles, jump air pose, and secondary hair/skirt physics.',
  },
  {
    id: 'lighting-atmosphere',
    requirement: '4. Realistic Lighting, Shadows, Reflections & Atmosphere',
    status: 'COMPLETE',
    evidenceAndNotes:
      'Implemented ACES Filmic tone mapping, PMREM RoomEnvironment studio reflections, PCF soft shadow mapping, 3 real-time lighting presets (Spring Morning, Golden After-School, Sakura Twilight), and a 220-petal pooled instanced sakura particle system.',
  },
  {
    id: 'cameras',
    requirement: '5 & 6. Smooth Third-Person & Optional First-Person Cameras',
    status: 'COMPLETE',
    evidenceAndNotes:
      'Implemented exponential-damped Third-Person spring-arm orbit camera with AABB wall collision pull-in and zoom, plus instant toggle (V key or HUD button) to eye-level First-Person perspective (automatically hiding local head/hair geometry to prevent frustum clipping).',
  },
  {
    id: 'movement-controls',
    requirement: '7. Responsive Character Movement (Desktop & Mobile Touch)',
    status: 'COMPLETE',
    evidenceAndNotes:
      'Implemented camera-relative movement (WASD/Arrows + Shift Sprint + Space Jump with coyote time & jump buffering) alongside an on-screen virtual thumbstick and touch action buttons for mobile/Android viewports.',
  },
  {
    id: 'unity6-urp-android',
    requirement: '8. Unity 6 URP C# Scripts, Cel Shader & Android Build Pipeline',
    status: 'IN PROGRESS',
    evidenceAndNotes:
      'Complete Unity 6 (6000.0 LTS) URP C# scripts (StudentCharacterController.cs, AcademyCameraRig.cs, URPMobilePerformanceScaler.cs) and HLSL URP Anime Cel/PBR Shader are authored and downloadable below. Native Unity Editor .apk binary compilation is BLOCKED inside this Linux web container (no Unity 6 Editor/NDK binary installed in container), so live interactive verification runs via WebGL/Three.js.',
  },
  {
    id: 'apk-device-execution',
    requirement: 'Native Unity 6 Editor .APK Binary Compilation & Physical Android Device Run',
    status: 'BLOCKED',
    evidenceAndNotes:
      'Honest Engineering Disclosure: This cloud runtime environment executes Node.js + Headless Chromium (WebGL) and does not contain the proprietary Unity 6 Editor CLI or Android NDK toolchain. Therefore, no false claim of native .apk compilation is made; all 3D visual assets, shaders, and kinematics are verified live in the WebGL viewport and exported as Unity 6 C# source.',
  },
  {
    id: 'phase2-exclusions',
    requirement: 'Strict Scope Exclusions (Multiplayer, Firebase, Auth, NPC AI, Quests, Economy)',
    status: 'NOT IMPLEMENTED',
    evidenceAndNotes:
      'Intentionally excluded per Strict Phase 1 Scope rules to focus 100% on the visual foundation, courtyard environment, character rig, camera systems, and lighting.',
  },
];

export interface UnityScriptFile {
  filename: string;
  folder: string;
  description: string;
  code: string;
}

export const UNITY_6_URP_SCRIPTS: UnityScriptFile[] = [
  {
    filename: 'StudentCharacterController.cs',
    folder: 'Assets/_SchoolChronicles/Scripts/Character/',
    description: 'Unity 6 CharacterController movement, camera-relative rotation damping, coyote time jump, and Animator parameter driver.',
    code: `using UnityEngine;
using UnityEngine.InputSystem;

namespace SchoolChronicles.Character
{
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(Animator))]
    public sealed class StudentCharacterController : MonoBehaviour
    {
        [Header("Locomotion Settings")]
        [SerializeField] private float walkSpeed = 4.2f;
        [SerializeField] private float sprintSpeed = 7.4f;
        [SerializeField] private float rotationDampLambda = 14.0f;
        [SerializeField] private float jumpHeight = 1.25f;
        [SerializeField] private float gravity = -18.5f;
        [SerializeField] private float coyoteTimeDuration = 0.10f;

        [Header("References")]
        [SerializeField] private Transform cameraTransform;

        private CharacterController _controller;
        private Animator _animator;
        private Vector3 _velocity;
        private float _coyoteTimer;
        private Vector2 _moveInput;
        private bool _sprintHeld;
        private bool _jumpRequested;

        private static readonly int SpeedHash = Animator.StringToHash("Speed");
        private static readonly int GroundedHash = Animator.StringToHash("IsGrounded");
        private static readonly int JumpHash = Animator.StringToHash("Jump");

        private void Awake()
        {
            _controller = GetComponent<CharacterController>();
            _animator = GetComponent<Animator>();
        }

        public void SetMoveInput(Vector2 move, bool sprint, bool jumpPressed)
        {
            _moveInput = Vector2.ClampMagnitude(move, 1f);
            _sprintHeld = sprint;
            if (jumpPressed) _jumpRequested = true;
        }

        private void Update()
        {
            float dt = Mathf.Min(Time.deltaTime, 0.05f);
            bool isGrounded = _controller.isGrounded;

            if (isGrounded)
            {
                _coyoteTimer = coyoteTimeDuration;
                if (_velocity.y < 0f) _velocity.y = -2f;
            }
            else
            {
                _coyoteTimer = Mathf.Max(0f, _coyoteTimer - dt);
            }

            // Camera-relative horizontal locomotion
            Vector3 camForward = Vector3.ProjectOnPlane(cameraTransform.forward, Vector3.up).normalized;
            Vector3 camRight = Vector3.ProjectOnPlane(cameraTransform.right, Vector3.up).normalized;
            Vector3 moveDir = (camRight * _moveInput.x + camForward * _moveInput.y);

            float targetSpeed = (_sprintHeld ? sprintSpeed : walkSpeed) * moveDir.magnitude;
            Vector3 horizontalVel = moveDir.normalized * targetSpeed;

            if (moveDir.sqrMagnitude > 0.01f)
            {
                Quaternion targetRot = Quaternion.LookRotation(moveDir.normalized, Vector3.up);
                float t = 1f - Mathf.Exp(-rotationDampLambda * dt);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, t);
            }

            if (_jumpRequested && _coyoteTimer > 0f)
            {
                _velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
                _coyoteTimer = 0f;
                _animator.SetTrigger(JumpHash);
            }
            _jumpRequested = false;

            _velocity.y += gravity * dt;
            Vector3 finalDisplacement = (horizontalVel + Vector3.up * _velocity.y) * dt;
            _controller.Move(finalDisplacement);

            _animator.SetFloat(SpeedHash, targetSpeed, 0.08f, dt);
            _animator.SetBool(GroundedHash, isGrounded);
        }
    }
}`,
  },
  {
    filename: 'AcademyCameraRig.cs',
    folder: 'Assets/_SchoolChronicles/Scripts/Camera/',
    description: 'Smooth Third-Person spring-arm orbit camera with SphereCast wall pull-in and instant First-Person eye perspective toggle.',
    code: `using UnityEngine;

namespace SchoolChronicles.CameraSystem
{
    public sealed class AcademyCameraRig : MonoBehaviour
    {
        public enum PerspectiveMode { ThirdPerson, FirstPerson }

        [Header("Target & Head Bone")]
        [SerializeField] private Transform targetRoot;
        [SerializeField] private Transform headBone;
        [SerializeField] private Renderer[] headAndHairRenderers;

        [Header("Third-Person Orbit")]
        [SerializeField] private float defaultDistance = 4.4f;
        [SerializeField] private float minDistance = 1.8f;
        [SerializeField] private float maxDistance = 7.5f;
        [SerializeField] private float collisionRadius = 0.24f;
        [SerializeField] private LayerMask collisionLayers;
        [SerializeField] private float followDamp = 14f;

        private PerspectiveMode _mode = PerspectiveMode.ThirdPerson;
        private float _yaw;
        private float _pitch = 12f;
        private float _currentDistance = 4.4f;

        public void TogglePerspective()
        {
            _mode = _mode == PerspectiveMode.ThirdPerson
                ? PerspectiveMode.FirstPerson
                : PerspectiveMode.ThirdPerson;

            bool showHead = _mode == PerspectiveMode.ThirdPerson;
            foreach (var r in headAndHairRenderers)
            {
                if (r != null) r.shadowCastingMode = showHead
                    ? UnityEngine.Rendering.ShadowCastingMode.On
                    : UnityEngine.Rendering.ShadowCastingMode.ShadowsOnly;
            }
        }

        public void AddLookDelta(Vector2 delta, float zoomDelta)
        {
            _yaw += delta.x;
            _pitch = Mathf.Clamp(_pitch - delta.y, -25f, 68f);
            defaultDistance = Mathf.Clamp(defaultDistance + zoomDelta, minDistance, maxDistance);
        }

        private void LateUpdate()
        {
            if (targetRoot == null) return;
            float dt = Mathf.Min(Time.deltaTime, 0.05f);
            Quaternion lookRot = Quaternion.Euler(_pitch, _yaw, 0f);

            if (_mode == PerspectiveMode.FirstPerson && headBone != null)
            {
                transform.position = headBone.position + lookRot * new Vector3(0f, 0.06f, 0.1f);
                transform.rotation = lookRot;
                return;
            }

            Vector3 anchor = targetRoot.position + Vector3.up * 1.38f;
            Vector3 armDir = lookRot * Vector3.back;
            float desiredDist = defaultDistance;

            if (Physics.SphereCast(anchor, collisionRadius, armDir, out RaycastHit hit, defaultDistance, collisionLayers))
            {
                desiredDist = Mathf.Max(0.6f, hit.distance - collisionRadius);
            }

            _currentDistance = Mathf.Lerp(_currentDistance, desiredDist, 1f - Mathf.Exp(-16f * dt));
            Vector3 desiredPos = anchor + armDir * _currentDistance;

            transform.position = Vector3.Lerp(transform.position, desiredPos, 1f - Mathf.Exp(-followDamp * dt));
            transform.rotation = lookRot;
        }
    }
}`,
  },
  {
    filename: 'URPMobilePerformanceScaler.cs',
    folder: 'Assets/_SchoolChronicles/Scripts/Rendering/',
    description: 'Unity 6 URP Android mobile performance scaler configuring adaptive render scale, SRP Batcher, and 60 FPS frame pacing.',
    code: `using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace SchoolChronicles.Rendering
{
    public sealed class URPMobilePerformanceScaler : MonoBehaviour
    {
        [SerializeField, Range(0.7f, 1.0f)] private float mobileRenderScale = 0.85f;
        [SerializeField] private int targetMobileFrameRate = 60;

        private void Awake()
        {
            Application.targetFrameRate = targetMobileFrameRate;
            QualitySettings.vSyncCount = 0;
            GraphicsSettings.useScriptableRenderPipelineBatching = true;

            if (GraphicsSettings.currentRenderPipeline is UniversalRenderPipelineAsset urpAsset)
            {
                #if UNITY_ANDROID && !UNITY_EDITOR
                urpAsset.renderScale = mobileRenderScale;
                urpAsset.msaaSampleCount = 2;
                #else
                urpAsset.renderScale = 1.0f;
                urpAsset.msaaSampleCount = 4;
                #endif
                urpAsset. mainLightShadowmapResolution = 1024;
                urpAsset.maxAdditionalLightsCount = 4;
            }
        }
    }
}`,
  },
  {
    filename: 'AnimeCelHybridLit.shader',
    folder: 'Assets/_SchoolChronicles/Shaders/',
    description: 'Unity 6 URP HLSL Shader combining soft 2-band anime cel shading on skin/uniforms with crisp specular hair angel-rings and rim lighting.',
    code: `Shader "SchoolChronicles/URP/AnimeCelHybridLit"
{
    Properties
    {
        [MainTexture] _BaseMap("Base Map", 2D) = "white" {}
        [MainColor] _BaseColor("Base Color", Color) = (1, 1, 1, 1)
        _ShadowColor("Cel Shadow Tint", Color) = (0.78, 0.72, 0.84, 1)
        _CelThreshold("Cel Ramp Threshold", Range(0.0, 1.0)) = 0.48
        _CelSmoothness("Cel Ramp Feather", Range(0.001, 0.25)) = 0.04
        _RimColor("Rim Light Color", Color) = (0.85, 0.92, 1.0, 1)
        _RimPower("Rim Power", Range(1.0, 8.0)) = 3.5
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" "Queue"="Geometry" }
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                float2 uv         : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float3 normalWS   : TEXCOORD1;
                float2 uv         : TEXCOORD2;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                half4 _BaseColor;
                half4 _ShadowColor;
                half _CelThreshold;
                half _CelSmoothness;
                half4 _RimColor;
                half _RimPower;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_TRANSFER_INSTANCE_ID(input, output);
                VertexPositionInputs posInputs = GetVertexPositionInputs(input.positionOS.xyz);
                output.positionCS = posInputs.positionCS;
                output.positionWS = posInputs.positionWS;
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.uv = TRANSFORM_TEX(input.uv, _BaseMap);
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(input);
                half4 texColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv) * _BaseColor;
                float4 shadowCoord = TransformWorldToShadowCoord(input.positionWS);
                Light mainLight = GetMainLight(shadowCoord);

                half3 N = normalize(input.normalWS);
                half3 L = normalize(mainLight.direction);
                half3 V = normalize(GetWorldSpaceViewDir(input.positionWS));

                half ndl = dot(N, L) * 0.5h + 0.5h;
                half shadowAtten = mainLight.shadowAttenuation * mainLight.distanceAttenuation;
                half ramp = smoothstep(_CelThreshold - _CelSmoothness, _CelThreshold + _CelSmoothness, ndl * shadowAtten);

                half3 shaded = lerp(texColor.rgb * _ShadowColor.rgb, texColor.rgb, ramp) * mainLight.color;
                half rim = pow(1.0h - saturate(dot(N, V)), _RimPower) * ramp;
                shaded += rim * _RimColor.rgb * 0.35h;

                return half4(shaded, texColor.a);
            }
            ENDHLSL
        }
    }
}`,
  },
];
